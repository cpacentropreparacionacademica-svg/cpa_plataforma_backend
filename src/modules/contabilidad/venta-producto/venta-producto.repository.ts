import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { toMoneyNumber, toOptionalPositiveInt } from '../../../common/utils/accounting.util';
import { BienVendible, ConsumoLote, LineaValuada, VentaProductoNormalized } from './venta-producto.types';

const METODOS_VALIDOS = new Set(['PEPS', 'UEPS', 'PROM']);

/** Acceso SQL del punto de venta. Mantiene el orquestador libre de consultas. */
@Injectable()
export class VentaProductoRepository {
  /** Carga los bienes vendibles con su existencia consolidada en una sola consulta. */
  async cargarBienes(manager: EntityManager, idsBien: number[]): Promise<Map<number, BienVendible>> {
    const rows = (await manager.query(
      `SELECT s.id_bien, s.sku, s.nombre, s.tipo, s.es_producto_tienda, s.estado_registro,
              s.metodo_valuacion, s.costo_referencia, s.precio_referencia,
              s.cantidad_disponible, s.costo_promedio,
              s.controla_inventario_loteable, s.controla_inventario_no_loteable,
              b.id_cuenta_ingreso, b.id_cuenta_costo_venta, b.id_cuenta_existencias
         FROM inventario.v_stock_bien s
         JOIN inventario.bien b ON b.id_bien = s.id_bien
        WHERE s.id_bien = ANY($1::bigint[])`,
      [idsBien],
    )) as Array<Record<string, unknown>>;

    const bienes = new Map<number, BienVendible>();
    for (const row of rows) {
      const metodo = String(row.metodo_valuacion ?? 'PROM').toUpperCase();
      bienes.set(Number(row.id_bien), {
        idBien: Number(row.id_bien),
        sku: String(row.sku ?? ''),
        nombre: String(row.nombre ?? ''),
        tipo: String(row.tipo ?? ''),
        esProductoTienda: Boolean(row.es_producto_tienda),
        controlaInventario: Boolean(row.controla_inventario_loteable) || Boolean(row.controla_inventario_no_loteable),
        metodoValuacion: (METODOS_VALIDOS.has(metodo) ? metodo : 'PROM') as BienVendible['metodoValuacion'],
        costoReferencia: toMoneyNumber(row.costo_referencia),
        precioReferencia: toMoneyNumber(row.precio_referencia),
        cantidadDisponible: Number(row.cantidad_disponible ?? 0),
        costoPromedio: toMoneyNumber(row.costo_promedio),
        idCuentaIngreso: toOptionalPositiveInt(row.id_cuenta_ingreso),
        idCuentaCostoVenta: toOptionalPositiveInt(row.id_cuenta_costo_venta),
        idCuentaExistencias: toOptionalPositiveInt(row.id_cuenta_existencias),
      });
    }

    for (const idBien of idsBien) {
      const bien = bienes.get(idBien);
      if (!bien) throw new BadRequestException(`No existe el producto id_bien=${idBien}.`);
      if (!bien.esProductoTienda) {
        throw new BadRequestException(
          `${bien.nombre} (SKU ${bien.sku}) no está marcado como producto de tienda y no puede venderse en caja.`,
        );
      }
    }

    const inactivo = rows.find(
      (row) => !['Activo', 'ACTIVO', 'activo'].includes(String(row.estado_registro ?? 'Activo')),
    );
    if (inactivo) {
      throw new BadRequestException(`El producto ${String(inactivo.nombre)} está inactivo y no puede venderse.`);
    }

    return bienes;
  }

  async insertTransaccion(
    manager: EntityManager,
    venta: VentaProductoNormalized,
    glosa: string,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const rows = (await manager.query(
      `INSERT INTO contabilidad.transaccion
        (tipo_transaccion, fecha_transaccion, sub_tipo_transaccion, glosa, id_tienda, id_sucursal, id_cliente, id_usuario_creador)
       VALUES ('VENTA', $1, 'VENTA_PRODUCTO_TIENDA', $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        venta.fecha,
        glosa.slice(0, 300),
        venta.idTienda || null,
        venta.idSucursal || null,
        venta.idCliente || null,
        authUserId || null,
      ],
    )) as Record<string, unknown>[];

    return rows[0];
  }

  async insertDetalleVenta(
    manager: EntityManager,
    idTransaccion: number,
    linea: LineaValuada,
    venta: VentaProductoNormalized,
    idCuentaIngreso: number | undefined,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const rows = (await manager.query(
      `INSERT INTO contabilidad.transaccion_detalle_venta
        (id_transaccion, numero_linea, id_cliente, id_producto_tienda, id_tienda, id_sucursal, id_cuenta_ingreso,
         descripcion, cantidad, precio_unitario, porcentaje_descuento, monto_descuento, monto_recargo,
         porcentaje_impuesto, monto_impuesto, moneda, observaciones, id_usuario_creador)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 0, 0, $13, $14, $15)
       RETURNING *`,
      [
        idTransaccion,
        linea.numeroLinea,
        venta.idCliente || null,
        linea.bien.idBien,
        venta.idTienda || null,
        venta.idSucursal || null,
        idCuentaIngreso || null,
        (linea.item.descripcion || linea.bien.nombre).slice(0, 300),
        linea.item.cantidad,
        linea.item.precioUnitario,
        linea.item.porcentajeDescuento,
        linea.item.montoDescuento,
        venta.moneda,
        linea.item.observaciones || null,
        authUserId || null,
      ],
    )) as Record<string, unknown>[];

    return rows[0];
  }

  async insertCabeceraVenta(
    manager: EntityManager,
    idTransaccion: number,
    venta: VentaProductoNormalized,
    totales: { cantidad: number; subtotal: number; descuento: number; total: number },
    cobro: { efectivo: number; qr: number },
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const rows = (await manager.query(
      `INSERT INTO contabilidad.transaccion_venta
        (id_transaccion, fecha_venta, id_cliente, id_tienda, id_sucursal, cantidad_total,
         precio_unitario_referencia, monto_subtotal, monto_descuento, monto_recargo, monto_impuesto,
         monto_total, moneda, monto_efectivo, monto_qr, monto_cxc, monto_paquete, observaciones, id_usuario_creador)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, 0, 0, $9, $10, $11, $12, 0, 0, $13, $14)
       RETURNING *`,
      [
        idTransaccion,
        venta.fecha,
        venta.idCliente || null,
        venta.idTienda || null,
        venta.idSucursal || null,
        totales.cantidad,
        totales.subtotal,
        totales.descuento,
        totales.total,
        venta.moneda,
        cobro.efectivo,
        cobro.qr,
        venta.observaciones || null,
        authUserId || null,
      ],
    )) as Record<string, unknown>[];

    return rows[0];
  }

  /** Registra la salida de inventario de un lote (o del bien, si no es loteable). */
  async insertMovimientoInventario(
    manager: EntityManager,
    idTransaccion: number,
    linea: LineaValuada,
    consumo: ConsumoLote,
    venta: VentaProductoNormalized,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const rows = (await manager.query(
      `INSERT INTO inventario.movimiento_detalle
        (id_bien, id_lote, cantidad, id_espacio_salida, id_transaccion, costo_unitario,
         fecha_movimiento, tipo_movimiento, estado_registro, id_usuario_creador)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'VENTA', 'Activo', $8)
       RETURNING *`,
      [
        linea.bien.idBien,
        consumo.idLote || null,
        consumo.cantidad,
        venta.idEspacioSalida || null,
        idTransaccion,
        consumo.costoUnitario,
        `${venta.fecha}T00:00:00Z`,
        authUserId || null,
      ],
    )) as Record<string, unknown>[];

    return rows[0];
  }
}
