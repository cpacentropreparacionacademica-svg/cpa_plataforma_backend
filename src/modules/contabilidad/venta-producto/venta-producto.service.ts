import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { insertMovimiento, toMoneyNumber } from '../../../common/utils/accounting.util';
import { toHttpDatabaseException } from '../../../common/utils/database-error.util';
import { VentaProductoAsientoService } from './venta-producto-asiento.service';
import { VentaProductoNormalizer } from './venta-producto.normalizer';
import { VentaProductoRepository } from './venta-producto.repository';
import { VentaProductoValuacionService } from './venta-producto-valuacion.service';
import { BienVendible, LineaValuada, VentaProductoBody, VentaProductoNormalized } from './venta-producto.types';

const TOLERANCIA_PAGO = 0.009;

/**
 * Punto de venta de productos de tienda.
 *
 * Confirmar una venta escribe, dentro de UNA sola transacción SQL:
 *   1. contabilidad.transaccion            (VENTA / VENTA_PRODUCTO_TIENDA)
 *   2. contabilidad.transaccion_detalle_venta   una fila por producto
 *   3. contabilidad.transaccion_venta            cabecera con las formas de pago
 *   4. inventario.movimiento_detalle             salida de stock por lote consumido
 *   5. contabilidad.transaccion_movimiento_cuenta asiento balanceado
 *
 * Si cualquier paso falla se revierte todo: no queda venta sin asiento ni stock
 * descargado sin venta.
 */
@Injectable()
export class VentaProductoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly normalizer: VentaProductoNormalizer,
    private readonly repository: VentaProductoRepository,
    private readonly valuacion: VentaProductoValuacionService,
    private readonly asiento: VentaProductoAsientoService,
  ) {}

  async registrar(payload: VentaProductoBody, authUserId?: string) {
    try {
      const venta = this.normalizer.normalize(payload);
      const data = await this.dataSource.transaction((manager) => this.procesar(manager, venta, authUserId));

      return {
        success: true,
        message: `Venta registrada correctamente por ${data.monto_total} ${venta.moneda}.`,
        data,
      };
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  private async procesar(manager: EntityManager, venta: VentaProductoNormalized, authUserId?: string) {
    const idsBien = [...new Set(venta.items.map((item) => item.idBien))];
    const bienes = await this.repository.cargarBienes(manager, idsBien);
    const lineas = await this.valuarLineas(manager, venta, bienes);

    const totales = this.calcularTotales(lineas);
    this.assertPagoCuadra(venta, totales.total);
    const cobro = this.repartirCobro(venta, totales.total);
    venta.idTienda = await this.repository.resolveTiendaId(manager, venta.idTienda);

    const transaccion = await this.repository.insertTransaccion(
      manager,
      venta,
      this.construirGlosa(lineas),
      authUserId,
    );
    const idTransaccion = Number(transaccion.id_transaccion);

    const detalles: Record<string, unknown>[] = [];
    const movimientosInventario: Record<string, unknown>[] = [];

    for (const linea of lineas) {
      detalles.push(
        await this.repository.insertDetalleVenta(
          manager,
          idTransaccion,
          linea,
          venta,
          linea.bien.idCuentaIngreso,
          authUserId,
        ),
      );
      for (const consumo of linea.consumos) {
        if (!linea.bien.controlaInventario) continue;
        movimientosInventario.push(
          await this.repository.insertMovimientoInventario(manager, idTransaccion, linea, consumo, venta, authUserId),
        );
      }
    }

    const cabecera = await this.repository.insertCabeceraVenta(
      manager,
      idTransaccion,
      venta,
      totales,
      cobro,
      authUserId,
    );

    const asiento = await this.asiento.construir(manager, venta, lineas, cobro);
    const movimientosContables: Record<string, unknown>[] = [];
    for (const movimiento of asiento) {
      movimientosContables.push(await insertMovimiento(manager, idTransaccion, movimiento, authUserId));
    }

    return {
      transaccion,
      transaccion_venta: cabecera,
      detalle_venta: detalles,
      movimientos_inventario: movimientosInventario,
      movimientos: movimientosContables,
      monto_total: totales.total,
      monto_subtotal: totales.subtotal,
      monto_descuento: totales.descuento,
      costo_total: totales.costo,
      monto_efectivo: cobro.efectivo,
      monto_qr: cobro.qr,
      efectivo_recibido: venta.montoEfectivo,
      cambio: toMoneyNumber(venta.montoEfectivo - cobro.efectivo),
    };
  }

  /**
   * El cliente puede entregar más efectivo del que cuesta la venta. A la caja
   * sólo entra la diferencia: el resto vuelve como cambio y no es un ingreso,
   * así que no puede llegar al asiento ni a la cabecera de venta.
   */
  private repartirCobro(venta: VentaProductoNormalized, total: number) {
    const qr = Math.min(venta.montoQr, total);
    return { efectivo: toMoneyNumber(total - qr), qr: toMoneyNumber(qr) };
  }

  private async valuarLineas(
    manager: EntityManager,
    venta: VentaProductoNormalized,
    bienes: Map<number, BienVendible>,
  ): Promise<LineaValuada[]> {
    const lineas: LineaValuada[] = [];

    for (let index = 0; index < venta.items.length; index += 1) {
      const item = venta.items[index];
      const bien = bienes.get(item.idBien) as BienVendible;

      // Un precio en cero toma el precio de referencia del catálogo: evita cobrar 0
      // por un descuido del cliente HTTP.
      const precioUnitario = item.precioUnitario > 0 ? item.precioUnitario : bien.precioReferencia;
      if (precioUnitario <= 0) {
        throw new BadRequestException(
          `${bien.nombre} (SKU ${bien.sku}) no tiene precio de referencia; envía precio_unitario en la línea ${index + 1}.`,
        );
      }

      const bruto = toMoneyNumber(item.cantidad * precioUnitario);
      const descuento = toMoneyNumber(Math.max(item.montoDescuento, (bruto * item.porcentajeDescuento) / 100));
      if (descuento > bruto) {
        throw new BadRequestException(`El descuento de la línea ${index + 1} supera el importe de la línea.`);
      }

      const montoTotal = toMoneyNumber(bruto - descuento);
      const consumos = await this.valuacion.resolverConsumos(manager, bien, item.cantidad);
      const costoTotal = toMoneyNumber(
        consumos.reduce((total, consumo) => total + consumo.cantidad * consumo.costoUnitario, 0),
      );

      lineas.push({
        item: { ...item, precioUnitario },
        bien,
        numeroLinea: index + 1,
        montoSubtotal: bruto,
        montoTotal,
        costoTotal,
        consumos,
      });
    }

    return lineas;
  }

  private calcularTotales(lineas: LineaValuada[]) {
    return {
      cantidad: toMoneyNumber(lineas.reduce((total, linea) => total + linea.item.cantidad, 0)),
      subtotal: toMoneyNumber(lineas.reduce((total, linea) => total + linea.montoSubtotal, 0)),
      descuento: toMoneyNumber(lineas.reduce((total, linea) => total + (linea.montoSubtotal - linea.montoTotal), 0)),
      total: toMoneyNumber(lineas.reduce((total, linea) => total + linea.montoTotal, 0)),
      costo: toMoneyNumber(lineas.reduce((total, linea) => total + linea.costoTotal, 0)),
    };
  }

  /**
   * El efectivo puede exceder el total (el cajero da cambio), pero el QR no:
   * un cobro electrónico de más no se devuelve por caja.
   */
  private assertPagoCuadra(venta: VentaProductoNormalized, total: number): void {
    if (venta.montoQr - total > TOLERANCIA_PAGO) {
      throw new BadRequestException(
        `El cobro por QR (${venta.montoQr}) supera el total de la venta (${total}). Ajusta el monto cobrado.`,
      );
    }
    const recibido = toMoneyNumber(venta.montoEfectivo + venta.montoQr);
    if (total - recibido > TOLERANCIA_PAGO) {
      throw new BadRequestException(
        `El pago no cubre la venta: recibido=${recibido}, total=${total}. Faltan ${toMoneyNumber(total - recibido)}.`,
      );
    }
  }

  private construirGlosa(lineas: LineaValuada[]): string {
    const detalle = lineas.map((linea) => `${linea.item.cantidad}x ${linea.bien.nombre}`).join(', ');
    return `Venta de tienda - ${detalle}`;
  }
}
