import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { toHttpDatabaseException } from '../../common/utils/database-error.util';

type MovimientoPayload = {
  id_cuenta?: unknown;
  debe?: unknown;
  haber?: unknown;
};

type TransaccionPayload = {
  tipo_transaccion?: unknown;
  fecha_transaccion?: unknown;
  sub_tipo_transaccion?: unknown;
  glosa?: unknown;
  id_centro_costo_mapa?: unknown;
  id_bien?: unknown;
  id_movimiento_detalle?: unknown;
  id_deuda?: unknown;
  id_pago_deuda?: unknown;
  id_empleado?: unknown;
  id_empleado_pago?: unknown;
  id_departamento?: unknown;
  id_clase_por_hora?: unknown;
  id_producto_educativo?: unknown;
  id_curso_version?: unknown;
  id_sucursal?: unknown;
  id_tienda?: unknown;
  id_proveedor?: unknown;
  id_dividendo_pago?: unknown;
  id_emision_titulo?: unknown;
  id_cliente?: unknown;
  id_pago_tutor?: unknown;
};

type CreateTransaccionConMovimientosBody = {
  transaccion?: TransaccionPayload;
  movimientos?: MovimientoPayload[];
};

type RevertirAsientoBody = {
  fecha_transaccion?: unknown;
  glosa?: unknown;
  motivo?: unknown;
};

type VentaClaseRegistrarBody = Record<string, unknown> & {
  fecha?: unknown;
  fecha_transaccion?: unknown;
  items?: unknown;
};

type VentaClaseNormalizedItem = {
  source: Record<string, unknown>;
  fecha: string;
  horaIngreso?: string;
  horaSalida?: string;
  idEstudiante?: number;
  estudianteTexto?: string;
  idTutor?: number;
  tutorTexto?: string;
  idAula?: number;
  idMateriaTree?: number;
  idProductoEducativo?: number;
  idProductoTienda?: number;
  idCursoVersion?: number;
  idSucursal?: number;
  idTienda?: number;
  idClasePorHora?: number;
  motivoClase?: string;
  materiaTexto?: string;
  tema?: string;
  subtema?: string;
  situacionBase: string;
  observaciones?: string;
  cantidad: number;
  precioUnitario: number;
  porcentajeDescuento: number;
  montoDescuento: number;
  porcentajeImpuesto: number;
  montoImpuesto: number;
  montoEfectivo: number;
  montoQr: number;
  montoCxc: number;
  montoPaquete: number;
  montoPagoDeclarado: number;
  moneda: string;
  cuentaIngreso?: unknown;
  cuentaIngresoCodigo?: unknown;
  cuentaEfectivo?: unknown;
  cuentaEfectivoCodigo?: unknown;
  cuentaQr?: unknown;
  cuentaQrCodigo?: unknown;
  cuentaCxc?: unknown;
  cuentaCxcCodigo?: unknown;
  cuentaPaqueteDiferido?: unknown;
  cuentaPaqueteDiferidoCodigo?: unknown;
  cuentaImpuesto?: unknown;
  cuentaImpuestoCodigo?: unknown;
};

type NormalizedMovimiento = {
  id_cuenta: number;
  debe: number;
  haber: number;
};

const TRANSACCION_INSERT_COLUMNS = [
  'tipo_transaccion',
  'fecha_transaccion',
  'sub_tipo_transaccion',
  'glosa',
  'id_centro_costo_mapa',
  'id_bien',
  'id_movimiento_detalle',
  'id_deuda',
  'id_pago_deuda',
  'id_empleado',
  'id_empleado_pago',
  'id_departamento',
  'id_clase_por_hora',
  'id_producto_educativo',
  'id_curso_version',
  'id_sucursal',
  'id_tienda',
  'id_proveedor',
  'id_dividendo_pago',
  'id_emision_titulo',
  'id_cliente',
  'id_pago_tutor',
] as const;

@Injectable()
export class ContabilidadAccountingService {
  constructor(private readonly dataSource: DataSource) {}

  async registrarVentaClase(payload: VentaClaseRegistrarBody, authUserId?: string) {
    try {
      const items = this.normalizeVentaClaseItems(payload, false);
      const data = await this.dataSource.transaction(async (manager) => {
        return this.processVentaClaseItem(manager, items[0], 1, authUserId);
      });

      return {
        success: true,
        message: 'Venta de clase registrada correctamente con detalle y asiento contable.',
        data,
      };
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async registrarVentaClaseBatch(payload: VentaClaseRegistrarBody, authUserId?: string) {
    try {
      const items = this.normalizeVentaClaseItems(payload, true);
      const data = await this.dataSource.transaction(async (manager) => {
        const registros: Record<string, unknown>[] = [];
        for (let index = 0; index < items.length; index += 1) {
          registros.push(await this.processVentaClaseItem(manager, items[index], index + 1, authUserId));
        }
        const total = registros.reduce((sum, registro) => sum + this.toMoneyNumber((registro as Record<string, unknown>).monto_total), 0);
        return {
          registros,
          count: registros.length,
          monto_total: Math.round(total * 100) / 100,
        };
      });

      return {
        success: true,
        message: `${data.count} venta(s) de clase registradas correctamente con detalle y asiento contable.`,
        data,
      };
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async crearTransaccionConMovimientos(payload: CreateTransaccionConMovimientosBody, authUserId?: string) {
    try {
      const transaccion = this.normalizeTransaccionPayload(payload?.transaccion);
      const movimientos = this.normalizeMovimientos(payload?.movimientos);
      this.assertBalanced(movimientos);

      const data = await this.dataSource.transaction(async (manager) => {
        const createdTransaccion = await this.insertTransaccion(manager, transaccion, authUserId);
        const idTransaccion = Number(createdTransaccion.id_transaccion);
        const createdMovimientos: Record<string, unknown>[] = [];

        for (const movimiento of movimientos) {
          createdMovimientos.push(await this.insertMovimiento(manager, idTransaccion, movimiento, authUserId));
        }

        return {
          transaccion: createdTransaccion,
          movimientos: createdMovimientos,
          totales: this.sumMovimientos(createdMovimientos),
        };
      });

      return {
        success: true,
        message: 'Transacción registrada correctamente con movimientos de cuenta en batch.',
        data,
      };
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async revertirAsiento(idTransaccion: string, payload: RevertirAsientoBody = {}, authUserId?: string) {
    const originalId = Number(idTransaccion);
    if (!Number.isInteger(originalId) || originalId <= 0) {
      throw new BadRequestException('id_transaccion debe ser un entero positivo.');
    }

    try {
      const data = await this.dataSource.transaction(async (manager) => {
        const originalRows = await manager.query(
          `SELECT * FROM contabilidad.transaccion WHERE id_transaccion = $1 AND COALESCE(estado_registro, 'Activo') = 'Activo' LIMIT 1`,
          [originalId],
        ) as Record<string, unknown>[];

        const original = originalRows[0];
        if (!original) throw new NotFoundException('No se encontró la transacción/asiento a revertir.');

        const movementRows = await manager.query(
          `SELECT *
             FROM contabilidad.transaccion_movimiento_cuenta
            WHERE id_transaccion = $1
              AND COALESCE(estado_registro, 'Activo') = 'Activo'
            ORDER BY id_movimiento ASC`,
          [originalId],
        ) as Record<string, unknown>[];

        if (movementRows.length === 0) {
          throw new BadRequestException('El asiento no tiene movimientos activos para revertir.');
        }

        const reversedMovimientos = movementRows.map((movement) => ({
          id_cuenta: Number(movement.id_cuenta),
          debe: this.toMoneyNumber(movement.haber),
          haber: this.toMoneyNumber(movement.debe),
        }));

        this.assertBalanced(reversedMovimientos);

        const glosa = String(
          payload?.glosa
          || `Reversión del asiento ${originalId}${payload?.motivo ? ` - ${payload.motivo}` : ''}`,
        ).slice(0, 300);

        const reverseTransaccion = await this.insertTransaccion(manager, {
          tipo_transaccion: original.tipo_transaccion || 'GENERAL',
          fecha_transaccion: payload?.fecha_transaccion || new Date().toISOString().slice(0, 10),
          sub_tipo_transaccion: 'REVERSO',
          glosa,
          id_centro_costo_mapa: original.id_centro_costo_mapa,
          id_bien: original.id_bien,
          id_movimiento_detalle: original.id_movimiento_detalle,
          id_deuda: original.id_deuda,
          id_pago_deuda: original.id_pago_deuda,
          id_empleado: original.id_empleado,
          id_empleado_pago: original.id_empleado_pago,
          id_departamento: original.id_departamento,
          id_clase_por_hora: original.id_clase_por_hora,
          id_producto_educativo: original.id_producto_educativo,
          id_curso_version: original.id_curso_version,
          id_sucursal: original.id_sucursal,
          id_tienda: original.id_tienda,
          id_proveedor: original.id_proveedor,
          id_dividendo_pago: original.id_dividendo_pago,
          id_emision_titulo: original.id_emision_titulo,
          id_cliente: original.id_cliente,
          id_pago_tutor: original.id_pago_tutor,
        }, authUserId);

        const reverseId = Number(reverseTransaccion.id_transaccion);
        const createdMovimientos: Record<string, unknown>[] = [];
        for (const movimiento of reversedMovimientos) {
          createdMovimientos.push(await this.insertMovimiento(manager, reverseId, movimiento, authUserId));
        }

        return {
          asiento_original: original,
          asiento_reverso: reverseTransaccion,
          movimientos_reverso: createdMovimientos,
          totales: this.sumMovimientos(createdMovimientos),
        };
      });

      return {
        success: true,
        message: 'Asiento revertido correctamente con movimientos inversos.',
        data,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  private normalizeVentaClaseItems(payload: VentaClaseRegistrarBody, batch: boolean): VentaClaseNormalizedItem[] {
    const inheritedFecha = payload?.fecha ?? payload?.fecha_transaccion;
    const candidate = batch ? payload?.items : (payload?.items ?? [payload]);

    if (!Array.isArray(candidate) || candidate.length === 0) {
      throw new BadRequestException(batch
        ? 'items debe contener al menos una fila del parte de clases pasadas.'
        : 'Debe enviar una fila o { items: [fila] } para registrar la venta de clase.');
    }

    if (!batch && candidate.length !== 1) {
      throw new BadRequestException('Para registrar varias filas usa /api/contabilidad/venta-clase/registrar-batch.');
    }

    if (candidate.length > 500) {
      throw new BadRequestException('No se pueden registrar más de 500 filas por batch.');
    }

    return candidate.map((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new BadRequestException(`La fila ${index + 1} debe ser un objeto JSON.`);
      }

      const item = raw as Record<string, unknown>;
      const fecha = this.toDateString(item.fecha ?? item.fecha_transaccion ?? inheritedFecha ?? new Date().toISOString().slice(0, 10), `items[${index}].fecha`);
      const montoEfectivo = this.toMoneyNumber(item.monto_efectivo ?? item.efectivo ?? 0);
      const montoQr = this.toMoneyNumber(item.monto_qr ?? item.qr ?? 0);
      const montoCxc = this.toMoneyNumber(item.monto_cxc ?? item.cxc ?? item.cuenta_por_cobrar ?? 0);
      const montoPaquete = this.toMoneyNumber(item.monto_paquete ?? item.paquete ?? item.paq ?? 0);
      const montoPagoDeclarado = this.toMoneyNumber(montoEfectivo + montoQr + montoCxc + montoPaquete);
      const cantidad = this.toPositiveNumber(item.cantidad ?? 1, `items[${index}].cantidad`);
      const precioUnitarioRaw = item.precio_unitario ?? item.precio ?? item.monto_unitario;
      const precioUnitario = precioUnitarioRaw === undefined || precioUnitarioRaw === null || precioUnitarioRaw === ''
        ? this.toMoneyNumber(montoPagoDeclarado / cantidad)
        : this.toMoneyNumber(precioUnitarioRaw);

      if (precioUnitario <= 0 && montoPagoDeclarado <= 0) {
        throw new BadRequestException(`La fila ${index + 1} debe tener importe positivo en efectivo, QR, CxC, paquete o precio_unitario.`);
      }

      for (const [label, value] of [
        ['monto_efectivo', montoEfectivo],
        ['monto_qr', montoQr],
        ['monto_cxc', montoCxc],
        ['monto_paquete', montoPaquete],
        ['precio_unitario', precioUnitario],
      ] as const) {
        if (value < 0) throw new BadRequestException(`items[${index}].${label} no puede ser negativo.`);
      }

      return {
        source: item,
        fecha,
        horaIngreso: this.toOptionalTimeString(item.hora_ingreso ?? item.hora_llegada),
        horaSalida: this.toOptionalTimeString(item.hora_salida),
        idEstudiante: this.toOptionalPositiveInt(item.id_estudiante ?? item.id_cliente),
        estudianteTexto: this.toOptionalString(item.estudiante_texto ?? item.nombre_estudiante ?? item.nombre_completo_estudiante),
        idTutor: this.toOptionalPositiveInt(item.id_tutor),
        tutorTexto: this.toOptionalString(item.tutor_texto ?? item.nombre_tutor),
        idAula: this.toOptionalPositiveInt(item.id_aula ?? item.id_espacio),
        idMateriaTree: this.toOptionalPositiveInt(item.id_materia_tree ?? item.id_tree),
        idProductoEducativo: this.toOptionalPositiveInt(item.id_producto_educativo),
        idProductoTienda: this.toOptionalPositiveInt(item.id_producto_tienda ?? item.id_bien),
        idCursoVersion: this.toOptionalPositiveInt(item.id_curso_version),
        idSucursal: this.toOptionalPositiveInt(item.id_sucursal),
        idTienda: this.toOptionalPositiveInt(item.id_tienda),
        idClasePorHora: this.toOptionalPositiveInt(item.id_clase_por_hora ?? item.id_clase),
        motivoClase: this.toOptionalString(item.motivo_clase ?? item.motivo) ?? 'Clase pasada registrada desde parte manual',
        materiaTexto: this.toOptionalString(item.materia_texto ?? item.materia ?? item.producto ?? item.materia_producto),
        tema: this.toOptionalString(item.tema),
        subtema: this.toOptionalString(item.subtema),
        situacionBase: this.toOptionalString(item.situacion_base ?? item.sit_base) ?? 'CLASE_PASADA',
        observaciones: this.toOptionalString(item.observaciones),
        cantidad,
        precioUnitario,
        porcentajeDescuento: this.toMoneyNumber(item.porcentaje_descuento ?? 0),
        montoDescuento: this.toMoneyNumber(item.monto_descuento ?? 0),
        porcentajeImpuesto: this.toMoneyNumber(item.porcentaje_impuesto ?? 0),
        montoImpuesto: this.toMoneyNumber(item.monto_impuesto ?? 0),
        montoEfectivo,
        montoQr,
        montoCxc,
        montoPaquete,
        montoPagoDeclarado,
        moneda: this.toOptionalString(item.moneda)?.slice(0, 3).toUpperCase() || 'BOB',
        cuentaIngreso: item.id_cuenta_ingreso,
        cuentaIngresoCodigo: item.codigo_cuenta_ingreso,
        cuentaEfectivo: item.id_cuenta_efectivo,
        cuentaEfectivoCodigo: item.codigo_cuenta_efectivo,
        cuentaQr: item.id_cuenta_qr,
        cuentaQrCodigo: item.codigo_cuenta_qr,
        cuentaCxc: item.id_cuenta_cxc,
        cuentaCxcCodigo: item.codigo_cuenta_cxc,
        cuentaPaqueteDiferido: item.id_cuenta_paquete_diferido ?? item.id_cuenta_ingreso_diferido,
        cuentaPaqueteDiferidoCodigo: item.codigo_cuenta_paquete_diferido ?? item.codigo_cuenta_ingreso_diferido,
        cuentaImpuesto: item.id_cuenta_impuesto ?? item.id_cuenta_iva_debito,
        cuentaImpuestoCodigo: item.codigo_cuenta_impuesto ?? item.codigo_cuenta_iva_debito,
      };
    });
  }

  private async processVentaClaseItem(
    manager: EntityManager,
    item: VentaClaseNormalizedItem,
    numeroLinea: number,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const warnings: string[] = [];

    const idCuentaIngreso = await this.resolveCuentaId(manager, item.cuentaIngreso, item.cuentaIngresoCodigo, '4.1.01.001', 'cuenta de ingreso por clases por hora');
    const idCuentaEfectivo = item.montoEfectivo > 0
      ? await this.resolveCuentaId(manager, item.cuentaEfectivo, item.cuentaEfectivoCodigo, '1.1.01.001', 'cuenta de caja efectivo')
      : undefined;
    const idCuentaQr = item.montoQr > 0
      ? await this.resolveCuentaId(manager, item.cuentaQr, item.cuentaQrCodigo, '1.1.01.013', 'cuenta de QR / pagos móviles')
      : undefined;
    const idCuentaCxc = item.montoCxc > 0
      ? await this.resolveCuentaId(manager, item.cuentaCxc, item.cuentaCxcCodigo, '1.1.03.001', 'cuenta por cobrar estudiantes')
      : undefined;
    const idCuentaPaqueteDiferido = item.montoPaquete > 0
      ? await this.resolveCuentaId(manager, item.cuentaPaqueteDiferido, item.cuentaPaqueteDiferidoCodigo, '2.1.06.003', 'ingresos diferidos por paquetes de horas')
      : undefined;
    const idCuentaImpuesto = (item.porcentajeImpuesto > 0 || item.montoImpuesto > 0)
      ? await this.resolveCuentaId(manager, item.cuentaImpuesto, item.cuentaImpuestoCodigo, '2.1.05.001', 'IVA débito fiscal')
      : undefined;

    const clase = await this.ensureClasePorHora(manager, item, warnings, authUserId);
    const idClasePorHora = item.idClasePorHora ?? this.toOptionalPositiveInt(clase?.id_clase);
    const descripcion = item.materiaTexto || item.motivoClase || 'Clase pasada';
    const estudianteDescripcion = item.estudianteTexto || (item.idEstudiante ? `estudiante ${item.idEstudiante}` : 'estudiante no identificado');

    const transaccion = await this.insertTransaccion(manager, {
      tipo_transaccion: 'VENTA',
      fecha_transaccion: item.fecha,
      sub_tipo_transaccion: 'VENTA_CLASE_PASADA',
      glosa: `Venta clase pasada - ${estudianteDescripcion} - ${descripcion}`.slice(0, 300),
      id_clase_por_hora: idClasePorHora,
      id_producto_educativo: item.idProductoEducativo,
      id_curso_version: item.idCursoVersion,
      id_sucursal: item.idSucursal,
      id_tienda: item.idTienda,
      id_cliente: item.idEstudiante,
    }, authUserId);

    const idTransaccion = Number(transaccion.id_transaccion);
    const detalleVenta = await this.insertDetalleVentaClase(manager, idTransaccion, numeroLinea, item, idCuentaIngreso, idClasePorHora, authUserId);
    const detalleTotal = this.toMoneyNumber(detalleVenta.monto_total);
    const detalleSubtotal = this.toMoneyNumber(detalleVenta.monto_subtotal);
    const detalleImpuesto = this.toMoneyNumber(detalleVenta.monto_impuesto);

    let montoEfectivo = item.montoEfectivo;
    let montoQr = item.montoQr;
    let montoCxc = item.montoCxc;
    let montoPaquete = item.montoPaquete;
    let pagoDeclarado = this.toMoneyNumber(montoEfectivo + montoQr + montoCxc + montoPaquete);

    if (pagoDeclarado === 0) {
      montoCxc = detalleTotal;
      pagoDeclarado = detalleTotal;
      warnings.push('No se recibió forma de pago; se registró automáticamente como cuenta por cobrar.');
    }

    if (Math.abs(pagoDeclarado - detalleTotal) > 0.009) {
      throw new BadRequestException(`La fila ${numeroLinea} no cuadra: formas de pago=${pagoDeclarado}, total venta=${detalleTotal}.`);
    }

    const movimientos: NormalizedMovimiento[] = [];
    if (montoEfectivo > 0 && idCuentaEfectivo) movimientos.push({ id_cuenta: idCuentaEfectivo, debe: montoEfectivo, haber: 0 });
    if (montoQr > 0 && idCuentaQr) movimientos.push({ id_cuenta: idCuentaQr, debe: montoQr, haber: 0 });
    if (montoCxc > 0) {
      const cuenta = idCuentaCxc ?? await this.resolveCuentaId(manager, undefined, undefined, '1.1.03.001', 'cuenta por cobrar estudiantes');
      movimientos.push({ id_cuenta: cuenta, debe: montoCxc, haber: 0 });
    }
    if (montoPaquete > 0 && idCuentaPaqueteDiferido) movimientos.push({ id_cuenta: idCuentaPaqueteDiferido, debe: montoPaquete, haber: 0 });

    const ingresoHaber = this.toMoneyNumber(detalleTotal - detalleImpuesto);
    if (ingresoHaber > 0) movimientos.push({ id_cuenta: idCuentaIngreso, debe: 0, haber: ingresoHaber });
    if (detalleImpuesto > 0 && idCuentaImpuesto) movimientos.push({ id_cuenta: idCuentaImpuesto, debe: 0, haber: detalleImpuesto });

    this.assertBalanced(movimientos);
    const movimientosCreados: Record<string, unknown>[] = [];
    for (const movimiento of movimientos) {
      movimientosCreados.push(await this.insertMovimiento(manager, idTransaccion, movimiento, authUserId));
    }

    const ventaClaseRegistro = await this.insertVentaClaseRegistro(manager, item, {
      idClasePorHora,
      idTransaccion,
      idDetalleVenta: Number(detalleVenta.id_detalle_venta),
      montoEfectivo,
      montoQr,
      montoCxc,
      montoPaquete,
      montoTotal: detalleTotal,
      warnings,
    }, authUserId);

    return {
      venta_clase_registro: ventaClaseRegistro,
      clase_por_hora: clase ?? null,
      transaccion,
      detalle_venta: detalleVenta,
      movimientos: movimientosCreados,
      totales: this.sumMovimientos(movimientosCreados),
      monto_total: detalleTotal,
      monto_subtotal: detalleSubtotal,
      monto_impuesto: detalleImpuesto,
      warnings,
    };
  }

  private async ensureClasePorHora(
    manager: EntityManager,
    item: VentaClaseNormalizedItem,
    warnings: string[],
    authUserId?: string,
  ): Promise<Record<string, unknown> | null> {
    if (item.idClasePorHora) {
      const rows = await manager.query(
        `SELECT * FROM servicios_educativos.clase_por_hora WHERE id_clase = $1 LIMIT 1`,
        [item.idClasePorHora],
      ) as Record<string, unknown>[];
      if (!rows[0]) throw new BadRequestException(`No existe id_clase_por_hora=${item.idClasePorHora}.`);
      return rows[0];
    }

    const canCreate = Boolean(item.idAula && item.idEstudiante && item.idTutor && item.idMateriaTree && item.horaIngreso && item.motivoClase);
    if (!canCreate) {
      warnings.push('No se creó servicios_educativos.clase_por_hora porque faltan IDs obligatorios: id_aula, id_estudiante, id_tutor, id_materia_tree y hora_ingreso. Se registró la venta y la trazabilidad del parte.');
      return null;
    }

    const rows = await manager.query(
      `INSERT INTO servicios_educativos.clase_por_hora
        (id_aula, id_estudiante, id_tutor, id_materia_tree, hora_llegada, hora_salida, motivo, modalidad, estado_operativo, estado_registro, id_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CERRADA', 'Activo', $9)
       RETURNING *`,
      [
        item.idAula,
        item.idEstudiante,
        item.idTutor,
        item.idMateriaTree,
        this.toTimestampString(item.fecha, item.horaIngreso),
        item.horaSalida ? this.toTimestampString(item.fecha, item.horaSalida) : null,
        item.motivoClase,
        this.toOptionalString(item.source.modalidad) || 'PRESENCIAL',
        authUserId || null,
      ],
    ) as Record<string, unknown>[];

    return rows[0];
  }

  private async insertDetalleVentaClase(
    manager: EntityManager,
    idTransaccion: number,
    numeroLinea: number,
    item: VentaClaseNormalizedItem,
    idCuentaIngreso: number,
    idClasePorHora: number | undefined,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const rows = await manager.query(
      `INSERT INTO contabilidad.transaccion_detalle_venta
        (id_transaccion, numero_linea, id_cliente, id_producto_educativo, id_producto_tienda, id_curso_version, id_clase_por_hora,
         id_tienda, id_sucursal, id_cuenta_ingreso, descripcion, cantidad, precio_unitario, porcentaje_descuento,
         monto_descuento, porcentaje_impuesto, monto_impuesto, moneda, observaciones, id_usuario_creador)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        idTransaccion,
        numeroLinea,
        item.idEstudiante || null,
        item.idProductoEducativo || null,
        item.idProductoTienda || null,
        item.idCursoVersion || null,
        idClasePorHora || null,
        item.idTienda || null,
        item.idSucursal || null,
        idCuentaIngreso,
        (item.materiaTexto || item.motivoClase || 'Clase pasada').slice(0, 300),
        item.cantidad,
        item.precioUnitario,
        item.porcentajeDescuento,
        item.montoDescuento,
        item.porcentajeImpuesto,
        item.montoImpuesto,
        item.moneda,
        item.observaciones || null,
        authUserId || null,
      ],
    ) as Record<string, unknown>[];

    return rows[0];
  }

  private async insertVentaClaseRegistro(
    manager: EntityManager,
    item: VentaClaseNormalizedItem,
    result: {
      idClasePorHora?: number;
      idTransaccion: number;
      idDetalleVenta: number;
      montoEfectivo: number;
      montoQr: number;
      montoCxc: number;
      montoPaquete: number;
      montoTotal: number;
      warnings: string[];
    },
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const rows = await manager.query(
      `INSERT INTO contabilidad.venta_clase_registro
        (fecha, hora_ingreso, hora_salida, id_estudiante, estudiante_texto, id_tutor, tutor_texto, id_aula,
         id_materia_tree, id_producto_educativo, id_curso_version, id_sucursal, id_tienda, motivo_clase,
         materia_texto, tema, subtema, monto_efectivo, monto_qr, monto_cxc, monto_paquete, monto_total,
         situacion_base, observaciones, id_clase_por_hora, id_transaccion, id_detalle_venta, estado_proceso,
         advertencias, payload_original, id_usuario_creador)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
               $9, $10, $11, $12, $13, $14,
               $15, $16, $17, $18, $19, $20, $21, $22,
               $23, $24, $25, $26, $27, 'REGISTRADO',
               $28::jsonb, $29::jsonb, $30)
       RETURNING *`,
      [
        item.fecha,
        item.horaIngreso || null,
        item.horaSalida || null,
        item.idEstudiante || null,
        item.estudianteTexto || null,
        item.idTutor || null,
        item.tutorTexto || null,
        item.idAula || null,
        item.idMateriaTree || null,
        item.idProductoEducativo || null,
        item.idCursoVersion || null,
        item.idSucursal || null,
        item.idTienda || null,
        item.motivoClase || null,
        item.materiaTexto || null,
        item.tema || null,
        item.subtema || null,
        result.montoEfectivo,
        result.montoQr,
        result.montoCxc,
        result.montoPaquete,
        result.montoTotal,
        item.situacionBase,
        item.observaciones || null,
        result.idClasePorHora || null,
        result.idTransaccion,
        result.idDetalleVenta,
        JSON.stringify(result.warnings),
        JSON.stringify(item.source),
        authUserId || null,
      ],
    ) as Record<string, unknown>[];

    return rows[0];
  }

  private async resolveCuentaId(
    manager: EntityManager,
    explicitId: unknown,
    explicitCode: unknown,
    defaultCode: string,
    label: string,
  ): Promise<number> {
    const id = this.toOptionalPositiveInt(explicitId);
    if (id) return id;

    const code = this.toOptionalString(explicitCode) || defaultCode;
    const rows = await manager.query(
      `SELECT id_cuenta FROM contabilidad.cuenta WHERE codigo = $1 AND COALESCE(estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo') LIMIT 1`,
      [code],
    ) as Array<{ id_cuenta: unknown }>;

    const resolved = this.toOptionalPositiveInt(rows[0]?.id_cuenta);
    if (!resolved) {
      throw new BadRequestException(`No se encontró ${label}. Código buscado: ${code}. Puedes enviar id_cuenta explícito en el payload.`);
    }
    return resolved;
  }

  private toOptionalPositiveInt(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
  }

  private toPositiveNumber(value: unknown, label: string): number {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException(`${label} debe ser un número positivo.`);
    }
    return Math.round(parsed * 1000000) / 1000000;
  }

  private toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
  }

  private toDateString(value: unknown, label: string): string {
    const text = this.toOptionalString(value);
    if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      throw new BadRequestException(`${label} debe tener formato YYYY-MM-DD.`);
    }
    return text;
  }

  private toOptionalTimeString(value: unknown): string | undefined {
    const text = this.toOptionalString(value);
    if (!text) return undefined;
    const normalized = text.length === 5 ? `${text}:00` : text;
    if (!/^\d{2}:\d{2}:\d{2}$/.test(normalized)) {
      throw new BadRequestException(`La hora '${text}' debe tener formato HH:mm o HH:mm:ss.`);
    }
    return normalized;
  }

  private toTimestampString(date: string, time?: string): string {
    return `${date} ${time || '00:00:00'}`;
  }

  private normalizeTransaccionPayload(payload?: TransaccionPayload): Record<string, unknown> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('El campo transaccion debe ser un objeto JSON.');
    }

    if (!payload.tipo_transaccion) {
      throw new BadRequestException('transaccion.tipo_transaccion es obligatorio.');
    }

    return TRANSACCION_INSERT_COLUMNS.reduce<Record<string, unknown>>((acc, column) => {
      const value = payload[column];
      if (value !== undefined) acc[column] = value;
      return acc;
    }, {});
  }

  private normalizeMovimientos(payload?: MovimientoPayload[]): NormalizedMovimiento[] {
    if (!Array.isArray(payload) || payload.length < 2) {
      throw new BadRequestException('movimientos debe contener al menos dos movimientos de cuenta.');
    }

    if (payload.length > 500) {
      throw new BadRequestException('movimientos no puede superar 500 registros por transacción.');
    }

    return payload.map((movement, index) => {
      if (!movement || typeof movement !== 'object' || Array.isArray(movement)) {
        throw new BadRequestException(`El movimiento ${index + 1} debe ser un objeto JSON.`);
      }

      const idCuenta = Number(movement.id_cuenta);
      const debe = this.toMoneyNumber(movement.debe ?? 0);
      const haber = this.toMoneyNumber(movement.haber ?? 0);

      if (!Number.isInteger(idCuenta) || idCuenta <= 0) {
        throw new BadRequestException(`movimientos[${index}].id_cuenta debe ser un entero positivo.`);
      }

      if (debe < 0 || haber < 0) {
        throw new BadRequestException(`movimientos[${index}] no puede tener debe/haber negativos.`);
      }

      if (debe === 0 && haber === 0) {
        throw new BadRequestException(`movimientos[${index}] debe tener importe en debe o haber.`);
      }

      if (debe > 0 && haber > 0) {
        throw new BadRequestException(`movimientos[${index}] no puede tener importe en debe y haber al mismo tiempo.`);
      }

      return { id_cuenta: idCuenta, debe, haber };
    });
  }

  private assertBalanced(movimientos: Array<{ debe: number; haber: number }>): void {
    const totals = this.sumMovimientos(movimientos);
    if (Math.abs(totals.debe - totals.haber) > 0.009) {
      throw new BadRequestException(`El asiento no está balanceado. Debe=${totals.debe}, Haber=${totals.haber}.`);
    }
  }

  private sumMovimientos(movimientos: Array<{ debe?: unknown; haber?: unknown }>): { debe: number; haber: number } {
    const debe = movimientos.reduce((total, movement) => total + this.toMoneyNumber(movement.debe), 0);
    const haber = movimientos.reduce((total, movement) => total + this.toMoneyNumber(movement.haber), 0);
    return {
      debe: Math.round(debe * 100) / 100,
      haber: Math.round(haber * 100) / 100,
    };
  }

  private toMoneyNumber(value: unknown): number {
    const numberValue = Number(value ?? 0);
    if (!Number.isFinite(numberValue)) {
      throw new BadRequestException('Los importes debe/haber deben ser numéricos.');
    }
    return Math.round(numberValue * 100) / 100;
  }

  private async insertTransaccion(
    manager: EntityManager,
    payload: Record<string, unknown>,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const data = { ...payload };
    if (!data.fecha_transaccion) data.fecha_transaccion = new Date().toISOString().slice(0, 10);
    if (authUserId && data.id_usuario_creador === undefined) data.id_usuario_creador = authUserId;

    const allowedColumns = [...TRANSACCION_INSERT_COLUMNS, 'id_usuario_creador'];
    const fields = allowedColumns.filter((column) => data[column] !== undefined && data[column] !== null);

    const columns = fields.map((field) => `"${field}"`).join(', ');
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const values = fields.map((field) => data[field]);

    const rows = await manager.query(
      `INSERT INTO contabilidad.transaccion (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    ) as Record<string, unknown>[];

    return rows[0];
  }

  private async insertMovimiento(
    manager: EntityManager,
    idTransaccion: number,
    movimiento: NormalizedMovimiento,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const rows = await manager.query(
      `INSERT INTO contabilidad.transaccion_movimiento_cuenta
        (id_transaccion, id_cuenta, debe, haber, id_usuario_creador)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [idTransaccion, movimiento.id_cuenta, movimiento.debe, movimiento.haber, authUserId || null],
    ) as Record<string, unknown>[];

    return rows[0];
  }
}
