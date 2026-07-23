import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { parseFechaObligatoria, parseRangoFechas, toImporte } from './reportes-query.util';

type LineaEstado = {
  subTipo: string;
  subGrupo: string | null;
  codigo: string;
  nombre: string;
  saldo: string;
};

/**
 * Estados financieros derivados exclusivamente de movimientos contabilizados.
 * Todas las sumas se calculan en base de datos sobre `v_movimiento_contable`.
 */
@Injectable()
export class ContabilidadEstadosFinancierosService {
  constructor(private readonly dataSource: DataSource) {}

  /** Estado de resultados: Resultado = Ingresos - Gastos, por el rango solicitado. */
  async getEstadoResultados(query: Record<string, unknown>) {
    const rango = parseRangoFechas(query);

    const filas = (await this.dataSource.query(
      `SELECT sub_tipo, sub_grupo, codigo_cuenta, nombre_cuenta,
              COALESCE(SUM(saldo_natural), 0) AS saldo
         FROM contabilidad.v_movimiento_contable
        WHERE tipo_reporte = 'RESULTADOS'
          AND fecha_transaccion BETWEEN $1::date AND $2::date
        GROUP BY sub_tipo, sub_grupo, codigo_cuenta, nombre_cuenta
       HAVING COALESCE(SUM(saldo_natural), 0) <> 0
        ORDER BY sub_tipo ASC, codigo_cuenta ASC`,
      [rango.desde, rango.hasta],
    )) as Array<Record<string, unknown>>;

    const ingresos = this.mapLineas(filas, 'INGRESO');
    const gastos = this.mapLineas(filas, 'GASTO');
    const totalIngresos = this.sumar(filas, 'INGRESO');
    const totalGastos = this.sumar(filas, 'GASTO');

    return {
      rango,
      ingresos: { lineas: ingresos, total: toImporte(totalIngresos) },
      gastos: { lineas: gastos, total: toImporte(totalGastos) },
      resultado: {
        // Resultado del ejercicio en la convención contable: ingresos menos gastos.
        valor: toImporte(totalIngresos - totalGastos),
        tipo: totalIngresos - totalGastos >= 0 ? 'UTILIDAD' : 'PERDIDA',
      },
    };
  }

  /**
   * Balance general a una fecha de corte. Incluye el resultado del ejercicio dentro del
   * patrimonio, que es lo que hace que se cumpla Activo = Pasivo + Patrimonio.
   */
  async getBalanceGeneral(query: Record<string, unknown>) {
    const fechaCorte = parseFechaObligatoria(query.fechaCorte ?? query.fecha_corte, 'fechaCorte');

    const filas = (await this.dataSource.query(
      `SELECT tipo_reporte, sub_tipo, sub_grupo, codigo_cuenta, nombre_cuenta,
              COALESCE(SUM(saldo_natural), 0) AS saldo
         FROM contabilidad.v_movimiento_contable
        WHERE fecha_transaccion <= $1::date
        GROUP BY tipo_reporte, sub_tipo, sub_grupo, codigo_cuenta, nombre_cuenta
       HAVING COALESCE(SUM(saldo_natural), 0) <> 0
        ORDER BY sub_tipo ASC, codigo_cuenta ASC`,
      [fechaCorte],
    )) as Array<Record<string, unknown>>;

    const balance = filas.filter((fila) => fila.tipo_reporte === 'BALANCE');
    const resultados = filas.filter((fila) => fila.tipo_reporte === 'RESULTADOS');

    const totalActivo = this.sumar(balance, 'ACTIVO');
    const totalPasivo = this.sumar(balance, 'PASIVO');
    const patrimonioContable = this.sumar(balance, 'PATRIMONIO');
    const resultadoEjercicio = this.sumar(resultados, 'INGRESO') - this.sumar(resultados, 'GASTO');
    const totalPatrimonio = patrimonioContable + resultadoEjercicio;

    const diferencia = totalActivo - (totalPasivo + totalPatrimonio);

    return {
      fechaCorte,
      activo: {
        lineas: this.mapLineas(balance, 'ACTIVO'),
        total: toImporte(totalActivo),
      },
      pasivo: {
        lineas: this.mapLineas(balance, 'PASIVO'),
        total: toImporte(totalPasivo),
      },
      patrimonio: {
        lineas: this.mapLineas(balance, 'PATRIMONIO'),
        resultadoEjercicio: toImporte(resultadoEjercicio),
        total: toImporte(totalPatrimonio),
      },
      ecuacionContable: {
        activo: toImporte(totalActivo),
        pasivoMasPatrimonio: toImporte(totalPasivo + totalPatrimonio),
        diferencia: toImporte(diferencia),
        cuadrado: Math.abs(diferencia) < 0.005,
      },
    };
  }

  /**
   * Tablero contable: todas las métricas en una sola consulta agregada.
   * Evita que el navegador cargue tablas completas para calcular tarjetas.
   */
  async getDashboard(query: Record<string, unknown>) {
    const fechaCorte = parseFechaObligatoria(
      query.fechaCorte ?? query.fecha_corte ?? new Date().toISOString().slice(0, 10),
      'fechaCorte',
    );
    const inicioMes = `${fechaCorte.slice(0, 7)}-01`;

    const [metricas] = (await this.dataSource.query(
      `SELECT
         COALESCE(SUM(saldo_natural) FILTER (
           WHERE sub_tipo = 'INGRESO' AND fecha_transaccion BETWEEN $2::date AND $1::date), 0) AS ingresos_mes,
         COALESCE(SUM(saldo_natural) FILTER (
           WHERE sub_tipo = 'GASTO'   AND fecha_transaccion BETWEEN $2::date AND $1::date), 0) AS gastos_mes,
         COALESCE(SUM(saldo_natural) FILTER (
           WHERE sub_tipo = 'INGRESO' AND fecha_transaccion = $1::date), 0) AS ingresos_dia,
         COALESCE(SUM(saldo_natural) FILTER (
           WHERE sub_tipo = 'GASTO'   AND fecha_transaccion = $1::date), 0) AS gastos_dia,
         COALESCE(SUM(saldo_natural) FILTER (WHERE codigo_cuenta LIKE '1.1.01.%'), 0) AS disponible,
         COALESCE(SUM(saldo_natural) FILTER (WHERE codigo_cuenta LIKE '1.1.02.%'), 0) AS cuentas_por_cobrar,
         COALESCE(SUM(saldo_natural) FILTER (WHERE sub_tipo = 'PASIVO'), 0)           AS pasivo_total,
         COUNT(DISTINCT id_transaccion)::bigint                                        AS asientos_acumulados,
         COUNT(DISTINCT id_transaccion) FILTER (WHERE es_reversion)::bigint            AS asientos_reversion
       FROM contabilidad.v_movimiento_contable
       WHERE fecha_transaccion <= $1::date`,
      [fechaCorte, inicioMes],
    )) as Array<Record<string, unknown>>;

    const [integridad] = (await this.dataSource.query(
      `SELECT COUNT(*) FILTER (WHERE NOT balanceado)::bigint AS asientos_descuadrados,
              COUNT(*) FILTER (WHERE lineas = 0)::bigint     AS asientos_sin_movimientos
         FROM contabilidad.v_asiento_integridad`,
    )) as Array<Record<string, unknown>>;

    const [periodos] = (await this.dataSource.query(
      `SELECT COUNT(*) FILTER (WHERE estado IN ('ABIERTO', 'REABIERTO'))::bigint AS periodos_abiertos,
              COUNT(*) FILTER (WHERE estado = 'CERRADO')::bigint                 AS periodos_cerrados
         FROM contabilidad.periodo_contable
        WHERE LOWER(COALESCE(estado_registro, 'Activo')) = 'activo'`,
    )) as Array<Record<string, unknown>>;

    const ingresosMes = Number(metricas?.ingresos_mes ?? 0);
    const gastosMes = Number(metricas?.gastos_mes ?? 0);

    return {
      fechaCorte,
      moneda: 'BOB',
      calculadoEn: new Date().toISOString(),
      metricas: {
        ingresosDia: toImporte(metricas?.ingresos_dia),
        gastosDia: toImporte(metricas?.gastos_dia),
        ingresosMes: toImporte(ingresosMes),
        gastosMes: toImporte(gastosMes),
        resultadoMes: toImporte(ingresosMes - gastosMes),
        disponible: toImporte(metricas?.disponible),
        cuentasPorCobrar: toImporte(metricas?.cuentas_por_cobrar),
        pasivoTotal: toImporte(metricas?.pasivo_total),
        asientosAcumulados: Number(metricas?.asientos_acumulados ?? 0),
        asientosReversion: Number(metricas?.asientos_reversion ?? 0),
      },
      alertas: {
        asientosDescuadrados: Number(integridad?.asientos_descuadrados ?? 0),
        asientosSinMovimientos: Number(integridad?.asientos_sin_movimientos ?? 0),
        periodosAbiertos: Number(periodos?.periodos_abiertos ?? 0),
        periodosCerrados: Number(periodos?.periodos_cerrados ?? 0),
      },
    };
  }

  private mapLineas(filas: Array<Record<string, unknown>>, subTipo: string): LineaEstado[] {
    return filas
      .filter((fila) => fila.sub_tipo === subTipo)
      .map((fila) => ({
        subTipo: String(fila.sub_tipo),
        subGrupo: (fila.sub_grupo as string) ?? null,
        codigo: String(fila.codigo_cuenta),
        nombre: String(fila.nombre_cuenta),
        saldo: toImporte(fila.saldo),
      }));
  }

  private sumar(filas: Array<Record<string, unknown>>, subTipo: string): number {
    return filas
      .filter((fila) => fila.sub_tipo === subTipo)
      .reduce((total, fila) => total + Number(fila.saldo ?? 0), 0);
  }
}
