import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

type ReporteriaContableQuery = {
  desde?: unknown;
  hasta?: unknown;
  fechaCorte?: unknown;
  fecha_corte?: unknown;
};

type CuentaReporteria = {
  idCuenta: number;
  id_cuenta: number;
  codigoCuenta: string;
  codigo_cuenta: string;
  nombreCuenta: string;
  nombre_cuenta: string;
  codigoConfiguracion?: string;
  codigo_configuracion?: string;
  fuente: 'CONFIGURACION_OPERATIVA' | 'GRUPO_DISPONIBLE';
  tipo: 'EFECTIVO' | 'QR' | 'DISPONIBLE_EQUIVALENTE';
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CASH_CONFIG_CODES = ['CANAL_COBRO_EFECTIVO', 'CANAL_COBRO_QR'] as const;

@Injectable()
export class ReporteriaContabilidadService {
  constructor(private readonly dataSource: DataSource) {}

  async getPowerBiMovimientos(query: ReporteriaContableQuery) {
    const desde = this.parseDateParam(query.desde, 'desde');
    const hasta = this.parseDateParam(query.hasta, 'hasta');
    const fechaCorte = this.parseDateParam(query.fechaCorte ?? query.fecha_corte, 'fechaCorte');

    if (desde > hasta) {
      throw new BadRequestException('La fecha desde no puede ser mayor que la fecha hasta.');
    }

    if (fechaCorte < hasta) {
      throw new BadRequestException('La fecha de corte debe ser mayor o igual a la fecha hasta.');
    }

    const [cuentasEfectivo, movimientos] = await Promise.all([
      this.listCuentasEfectivoDisponible(),
      this.listMovimientosHastaFechaCorte(fechaCorte),
    ]);

    const cuentaEfectivo =
      cuentasEfectivo.find((cuenta) => cuenta.tipo === 'EFECTIVO')
      ?? cuentasEfectivo[0]
      ?? null;

    const metadata = {
      generadoEn: new Date().toISOString(),
      generado_en: new Date().toISOString(),
      origen: 'contabilidad.v_powerbi_contable_movimiento',
      desde,
      hasta,
      fechaCorte,
      fecha_corte: fechaCorte,
      moneda: 'BOB',
      cuentaEfectivo,
      cuenta_efectivo: cuentaEfectivo,
      cuentasEfectivo,
      cuentas_efectivo: cuentasEfectivo,
      cuentasDisponible: cuentasEfectivo,
      cuentas_disponible: cuentasEfectivo,
      reglas: {
        movimientosHastaFechaCorte: true,
        movimientos_hasta_fecha_corte: true,
        efectivoIncluye: ['CANAL_COBRO_EFECTIVO', 'CANAL_COBRO_QR', 'grupo 1.1.01 disponible'],
        efectivo_incluye: ['CANAL_COBRO_EFECTIVO', 'CANAL_COBRO_QR', 'grupo 1.1.01 disponible'],
      },
    };

    return {
      success: true,
      message: 'Movimientos contables para reportería generados correctamente.',
      metadata,
      movimientos,
      data: {
        metadata,
        movimientos,
      },
      count: movimientos.length,
      total: movimientos.length,
    };
  }

  private parseDateParam(value: unknown, field: string): string {
    if (typeof value !== 'string' || !DATE_RE.test(value)) {
      throw new BadRequestException(`El parámetro ${field} es obligatorio y debe tener formato YYYY-MM-DD.`);
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException(`El parámetro ${field} no es una fecha válida.`);
    }

    return value;
  }

  private async listMovimientosHastaFechaCorte(fechaCorte: string): Promise<Record<string, unknown>[]> {
    return this.dataSource.query(
      `SELECT
          id_transaccion,
          id_movimiento,
          fecha_transaccion,
          periodo_inicio,
          periodo_fin,
          anio,
          mes,
          tipo_transaccion,
          sub_tipo_transaccion,
          glosa,
          id_cuenta,
          codigo_cuenta,
          nombre_cuenta,
          id_grupo_cuenta,
          codigo_grupo_cuenta,
          nombre_grupo_cuenta,
          tipo_reporte,
          sub_tipo,
          sub_grupo,
          orden_reporte,
          debe,
          haber,
          saldo_deudor,
          saldo_natural,
          naturaleza_saldo
         FROM contabilidad.v_powerbi_contable_movimiento
        WHERE fecha_transaccion <= $1::date
        ORDER BY fecha_transaccion ASC, id_transaccion ASC, id_movimiento ASC`,
      [fechaCorte],
    ) as Promise<Record<string, unknown>[]>;
  }

  private async listCuentasEfectivoDisponible(): Promise<CuentaReporteria[]> {
    const configuredRows = await this.dataSource.query(
      `SELECT DISTINCT
          c.id_cuenta AS "idCuenta",
          c.codigo AS "codigoCuenta",
          c.nombre_cuenta AS "nombreCuenta",
          cco.codigo AS "codigoConfiguracion",
          CASE
            WHEN cco.codigo = 'CANAL_COBRO_EFECTIVO' THEN 'EFECTIVO'
            WHEN cco.codigo = 'CANAL_COBRO_QR' THEN 'QR'
            ELSE 'DISPONIBLE_EQUIVALENTE'
          END AS tipo,
          'CONFIGURACION_OPERATIVA' AS fuente
         FROM contabilidad.configuracion_cuenta_operativa cco
         JOIN contabilidad.cuenta c ON c.id_cuenta = cco.id_cuenta
        WHERE cco.codigo = ANY($1::text[])
          AND COALESCE(cco.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
          AND COALESCE(c.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
        ORDER BY cco.codigo ASC`,
      [CASH_CONFIG_CODES],
    ) as Array<{
      idCuenta: unknown;
      codigoCuenta: unknown;
      nombreCuenta: unknown;
      codigoConfiguracion: unknown;
      tipo: CuentaReporteria['tipo'];
      fuente: CuentaReporteria['fuente'];
    }>;

    const disponibleRows = await this.dataSource.query(
      `SELECT DISTINCT
          c.id_cuenta AS "idCuenta",
          c.codigo AS "codigoCuenta",
          c.nombre_cuenta AS "nombreCuenta",
          NULL::text AS "codigoConfiguracion",
          'DISPONIBLE_EQUIVALENTE' AS tipo,
          'GRUPO_DISPONIBLE' AS fuente
         FROM contabilidad.cuenta c
         JOIN contabilidad.grupo_cuenta gc ON gc.id_grupo_cuenta = c.id_grupo_cuenta
        WHERE COALESCE(c.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
          AND COALESCE(gc.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
          AND (
            c.codigo LIKE '1.1.01.%'
            OR gc.codigo = '1.1.01'
            OR lower(gc.nombre) LIKE '%disponible%'
            OR lower(gc.nombre) LIKE '%efectivo%'
          )
        ORDER BY c.codigo ASC`,
    ) as Array<{
      idCuenta: unknown;
      codigoCuenta: unknown;
      nombreCuenta: unknown;
      codigoConfiguracion: unknown;
      tipo: CuentaReporteria['tipo'];
      fuente: CuentaReporteria['fuente'];
    }>;

    const byId = new Map<number, CuentaReporteria>();
    for (const row of [...configuredRows, ...disponibleRows]) {
      const idCuenta = Number(row.idCuenta);
      if (!Number.isInteger(idCuenta) || idCuenta <= 0) continue;

      const previous = byId.get(idCuenta);
      const tipo = previous?.tipo && previous.fuente === 'CONFIGURACION_OPERATIVA'
        ? previous.tipo
        : row.tipo;
      const fuente = previous?.fuente === 'CONFIGURACION_OPERATIVA'
        ? previous.fuente
        : row.fuente;
      const codigoConfiguracion = previous?.codigoConfiguracion || this.optionalString(row.codigoConfiguracion);

      byId.set(idCuenta, {
        idCuenta,
        id_cuenta: idCuenta,
        codigoCuenta: String(row.codigoCuenta || ''),
        codigo_cuenta: String(row.codigoCuenta || ''),
        nombreCuenta: String(row.nombreCuenta || ''),
        nombre_cuenta: String(row.nombreCuenta || ''),
        ...(codigoConfiguracion ? { codigoConfiguracion, codigo_configuracion: codigoConfiguracion } : {}),
        tipo,
        fuente,
      });
    }

    return [...byId.values()].sort((a, b) => a.codigoCuenta.localeCompare(b.codigoCuenta));
  }

  private optionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  }
}
