import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  construirPaginacion,
  parseEnteroPositivoOpcional,
  parsePaginacion,
  parseRangoFechas,
  toImporte,
} from './reportes-query.util';

const ORDEN_DIARIO: Record<string, string> = {
  fecha: 'fecha_transaccion',
  asiento: 'id_transaccion',
};

/**
 * Libros contables. Cada consulta agrega en base de datos y pagina en servidor:
 * ninguna pantalla recibe el libro completo para calcular totales en el navegador.
 */
@Injectable()
export class ContabilidadLibrosService {
  constructor(private readonly dataSource: DataSource) {}

  /** Libro diario: asientos del periodo con sus totales, paginado por asiento. */
  async getLibroDiario(query: Record<string, unknown>) {
    const rango = parseRangoFechas(query);
    const paginacion = parsePaginacion(query);
    const orden = ORDEN_DIARIO[String(query.orderBy ?? 'fecha')] ?? ORDEN_DIARIO.fecha;

    const [totales] = (await this.dataSource.query(
      `SELECT COUNT(DISTINCT id_transaccion)::bigint AS total_asientos,
              COALESCE(SUM(debe), 0)  AS total_debe,
              COALESCE(SUM(haber), 0) AS total_haber
         FROM contabilidad.v_movimiento_contable
        WHERE fecha_transaccion BETWEEN $1::date AND $2::date`,
      [rango.desde, rango.hasta],
    )) as Array<Record<string, unknown>>;

    const asientos = (await this.dataSource.query(
      `WITH asiento_pagina AS (
         SELECT id_transaccion, fecha_transaccion, tipo_transaccion, sub_tipo_transaccion,
                glosa, es_reversion, id_transaccion_revertida,
                SUM(debe) AS total_debe, SUM(haber) AS total_haber, COUNT(*)::int AS lineas
           FROM contabilidad.v_movimiento_contable
          WHERE fecha_transaccion BETWEEN $1::date AND $2::date
          GROUP BY id_transaccion, fecha_transaccion, tipo_transaccion, sub_tipo_transaccion,
                   glosa, es_reversion, id_transaccion_revertida
          ORDER BY ${orden} ASC, id_transaccion ASC
          LIMIT $3 OFFSET $4
       )
       SELECT asiento_pagina.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'idMovimiento', movimiento.id_movimiento,
                    'idCuenta',     movimiento.id_cuenta,
                    'codigoCuenta', movimiento.codigo_cuenta,
                    'nombreCuenta', movimiento.nombre_cuenta,
                    'debe',         movimiento.debe,
                    'haber',        movimiento.haber
                  ) ORDER BY movimiento.id_movimiento
                ) FILTER (WHERE movimiento.id_movimiento IS NOT NULL),
                '[]'::json
              ) AS movimientos
         FROM asiento_pagina
         LEFT JOIN contabilidad.v_movimiento_contable AS movimiento
                ON movimiento.id_transaccion = asiento_pagina.id_transaccion
        GROUP BY asiento_pagina.id_transaccion, asiento_pagina.fecha_transaccion,
                 asiento_pagina.tipo_transaccion, asiento_pagina.sub_tipo_transaccion,
                 asiento_pagina.glosa, asiento_pagina.es_reversion,
                 asiento_pagina.id_transaccion_revertida, asiento_pagina.total_debe,
                 asiento_pagina.total_haber, asiento_pagina.lineas
        ORDER BY ${orden} ASC, asiento_pagina.id_transaccion ASC`,
      [rango.desde, rango.hasta, paginacion.pageSize, paginacion.offset],
    )) as Array<Record<string, unknown>>;

    return {
      items: asientos.map((asiento) => ({
        idTransaccion: Number(asiento.id_transaccion),
        fecha: asiento.fecha_transaccion,
        tipo: asiento.tipo_transaccion,
        subTipo: asiento.sub_tipo_transaccion,
        glosa: asiento.glosa,
        esReversion: Boolean(asiento.es_reversion),
        idTransaccionRevertida: asiento.id_transaccion_revertida ?? null,
        lineas: Number(asiento.lineas),
        totalDebe: toImporte(asiento.total_debe),
        totalHaber: toImporte(asiento.total_haber),
        movimientos: asiento.movimientos,
      })),
      pagination: construirPaginacion(paginacion, Number(totales?.total_asientos ?? 0)),
      resumen: {
        rango,
        totalDebe: toImporte(totales?.total_debe),
        totalHaber: toImporte(totales?.total_haber),
        cuadrado: toImporte(totales?.total_debe) === toImporte(totales?.total_haber),
      },
    };
  }

  /**
   * Libro mayor de una cuenta: saldo inicial anterior al rango, movimientos del rango
   * y saldo final. El saldo se reconstruye siempre desde los movimientos.
   */
  async getLibroMayor(query: Record<string, unknown>) {
    const rango = parseRangoFechas(query);
    const paginacion = parsePaginacion(query);
    const idCuenta = parseEnteroPositivoOpcional(query.idCuenta ?? query.id_cuenta, 'idCuenta');

    if (!idCuenta) {
      throw new NotFoundException('idCuenta es obligatorio para consultar el libro mayor.');
    }

    const [cuenta] = (await this.dataSource.query(
      `SELECT id_cuenta, codigo, nombre_cuenta, tipo_reporte, sub_tipo, naturaleza_saldo
         FROM contabilidad.v_plan_cuentas
        WHERE id_cuenta = $1
        LIMIT 1`,
      [idCuenta],
    )) as Array<Record<string, unknown>>;

    if (!cuenta) throw new NotFoundException(`No existe la cuenta ${idCuenta}.`);

    const [inicial] = (await this.dataSource.query(
      `SELECT COALESCE(SUM(debe), 0)  AS debe,
              COALESCE(SUM(haber), 0) AS haber
         FROM contabilidad.v_movimiento_contable
        WHERE id_cuenta = $1 AND fecha_transaccion < $2::date`,
      [idCuenta, rango.desde],
    )) as Array<Record<string, unknown>>;

    const [periodo] = (await this.dataSource.query(
      `SELECT COUNT(*)::bigint         AS total_items,
              COALESCE(SUM(debe), 0)   AS debe,
              COALESCE(SUM(haber), 0)  AS haber
         FROM contabilidad.v_movimiento_contable
        WHERE id_cuenta = $1 AND fecha_transaccion BETWEEN $2::date AND $3::date`,
      [idCuenta, rango.desde, rango.hasta],
    )) as Array<Record<string, unknown>>;

    const movimientos = (await this.dataSource.query(
      `SELECT id_movimiento, id_transaccion, fecha_transaccion, tipo_transaccion,
              glosa, debe, haber, es_reversion,
              SUM(debe - haber) OVER (
                ORDER BY fecha_transaccion, id_transaccion, id_movimiento
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
              ) AS saldo_acumulado_periodo
         FROM contabilidad.v_movimiento_contable
        WHERE id_cuenta = $1 AND fecha_transaccion BETWEEN $2::date AND $3::date
        ORDER BY fecha_transaccion ASC, id_transaccion ASC, id_movimiento ASC
        LIMIT $4 OFFSET $5`,
      [idCuenta, rango.desde, rango.hasta, paginacion.pageSize, paginacion.offset],
    )) as Array<Record<string, unknown>>;

    const saldoInicial = Number(inicial?.debe ?? 0) - Number(inicial?.haber ?? 0);
    const saldoFinal = saldoInicial + Number(periodo?.debe ?? 0) - Number(periodo?.haber ?? 0);
    const esDeudora = cuenta.naturaleza_saldo === 'DEUDOR';

    return {
      cuenta: {
        idCuenta: Number(cuenta.id_cuenta),
        codigo: cuenta.codigo,
        nombre: cuenta.nombre_cuenta,
        tipoReporte: cuenta.tipo_reporte,
        subTipo: cuenta.sub_tipo,
        naturaleza: cuenta.naturaleza_saldo,
      },
      items: movimientos.map((movimiento) => ({
        idMovimiento: Number(movimiento.id_movimiento),
        idTransaccion: Number(movimiento.id_transaccion),
        fecha: movimiento.fecha_transaccion,
        tipo: movimiento.tipo_transaccion,
        glosa: movimiento.glosa,
        esReversion: Boolean(movimiento.es_reversion),
        debe: toImporte(movimiento.debe),
        haber: toImporte(movimiento.haber),
        saldoAcumulado: toImporte(saldoInicial + Number(movimiento.saldo_acumulado_periodo ?? 0)),
      })),
      pagination: construirPaginacion(paginacion, Number(periodo?.total_items ?? 0)),
      resumen: {
        rango,
        saldoInicial: toImporte(saldoInicial),
        debePeriodo: toImporte(periodo?.debe),
        haberPeriodo: toImporte(periodo?.haber),
        saldoFinal: toImporte(saldoFinal),
        // El saldo se expresa también en la naturaleza de la cuenta, para lectura contable.
        saldoFinalNatural: toImporte(esDeudora ? saldoFinal : -saldoFinal),
      },
    };
  }

  /** Balance de comprobación de sumas y saldos, agregado y paginado en base de datos. */
  async getBalanceComprobacion(query: Record<string, unknown>) {
    const rango = parseRangoFechas(query);
    const paginacion = parsePaginacion(query);

    const [totales] = (await this.dataSource.query(
      `SELECT COUNT(DISTINCT id_cuenta)::bigint AS total_items,
              COALESCE(SUM(debe), 0)  AS total_debe,
              COALESCE(SUM(haber), 0) AS total_haber
         FROM contabilidad.v_movimiento_contable
        WHERE fecha_transaccion BETWEEN $1::date AND $2::date`,
      [rango.desde, rango.hasta],
    )) as Array<Record<string, unknown>>;

    const cuentas = (await this.dataSource.query(
      `SELECT id_cuenta, codigo_cuenta, nombre_cuenta, tipo_reporte, sub_tipo, naturaleza_saldo,
              COALESCE(SUM(debe), 0)  AS debe,
              COALESCE(SUM(haber), 0) AS haber,
              COALESCE(SUM(debe), 0) - COALESCE(SUM(haber), 0) AS saldo
         FROM contabilidad.v_movimiento_contable
        WHERE fecha_transaccion BETWEEN $1::date AND $2::date
        GROUP BY id_cuenta, codigo_cuenta, nombre_cuenta, tipo_reporte, sub_tipo, naturaleza_saldo
        ORDER BY codigo_cuenta ASC
        LIMIT $3 OFFSET $4`,
      [rango.desde, rango.hasta, paginacion.pageSize, paginacion.offset],
    )) as Array<Record<string, unknown>>;

    const totalDebe = toImporte(totales?.total_debe);
    const totalHaber = toImporte(totales?.total_haber);

    return {
      items: cuentas.map((cuenta) => {
        const saldo = Number(cuenta.saldo ?? 0);
        return {
          idCuenta: Number(cuenta.id_cuenta),
          codigo: cuenta.codigo_cuenta,
          nombre: cuenta.nombre_cuenta,
          tipoReporte: cuenta.tipo_reporte,
          subTipo: cuenta.sub_tipo,
          naturaleza: cuenta.naturaleza_saldo,
          debe: toImporte(cuenta.debe),
          haber: toImporte(cuenta.haber),
          saldoDeudor: toImporte(saldo > 0 ? saldo : 0),
          saldoAcreedor: toImporte(saldo < 0 ? -saldo : 0),
        };
      }),
      pagination: construirPaginacion(paginacion, Number(totales?.total_items ?? 0)),
      resumen: {
        rango,
        totalDebe,
        totalHaber,
        cuadrado: totalDebe === totalHaber,
      },
    };
  }
}
