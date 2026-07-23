import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { toHttpDatabaseException } from '../../../common/utils/database-error.util';
import { parseEnteroPositivoOpcional, toImporte } from './reportes-query.util';

/**
 * Ciclo de vida del periodo contable.
 *
 * El cierre es una operación contable, no un cambio de estado cualquiera: exige que no
 * queden asientos descuadrados ni asientos sin movimientos dentro del rango.
 */
@Injectable()
export class ContabilidadPeriodosService {
  constructor(private readonly dataSource: DataSource) {}

  async listar() {
    const periodos = (await this.dataSource.query(
      `SELECT id_periodo, codigo, anio, mes, fecha_inicio, fecha_fin, estado,
              fecha_cierre, id_usuario_cierre, motivo_reapertura, fecha_reapertura
         FROM contabilidad.periodo_contable
        WHERE LOWER(COALESCE(estado_registro, 'Activo')) = 'activo'
        ORDER BY anio DESC, mes DESC`,
    )) as Array<Record<string, unknown>>;

    return {
      items: periodos.map((periodo) => ({
        idPeriodo: Number(periodo.id_periodo),
        codigo: periodo.codigo,
        anio: Number(periodo.anio),
        mes: Number(periodo.mes),
        fechaInicio: periodo.fecha_inicio,
        fechaFin: periodo.fecha_fin,
        estado: periodo.estado,
        fechaCierre: periodo.fecha_cierre ?? null,
        motivoReapertura: periodo.motivo_reapertura ?? null,
      })),
    };
  }

  async crear(body: Record<string, unknown>, authUserId?: string) {
    const anio = parseEnteroPositivoOpcional(body.anio, 'anio');
    const mes = parseEnteroPositivoOpcional(body.mes, 'mes');

    if (!anio || !mes || mes > 12) {
      throw new BadRequestException('anio y mes (1-12) son obligatorios para crear un periodo contable.');
    }

    const codigo = `${anio}-${String(mes).padStart(2, '0')}`;

    try {
      const [periodo] = (await this.dataSource.query(
        `INSERT INTO contabilidad.periodo_contable
           (codigo, anio, mes, fecha_inicio, fecha_fin, estado, id_usuario_creador)
         VALUES ($1, $2, $3,
                 make_date($2, $3, 1),
                 (make_date($2, $3, 1) + INTERVAL '1 month' - INTERVAL '1 day')::date,
                 'ABIERTO', $4)
         RETURNING id_periodo, codigo, fecha_inicio, fecha_fin, estado`,
        [codigo, anio, mes, authUserId || null],
      )) as Array<Record<string, unknown>>;

      return {
        success: true,
        message: `Periodo contable ${codigo} creado.`,
        data: periodo,
      };
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  /** Cierra un periodo tras verificar que su contenido contable es consistente. */
  async cerrar(idPeriodo: string, body: Record<string, unknown>, authUserId?: string) {
    const periodo = await this.buscarPeriodo(idPeriodo);

    if (periodo.estado === 'CERRADO') {
      throw new ConflictException(`El periodo ${periodo.codigo} ya está cerrado.`);
    }

    const [pendientes] = (await this.dataSource.query(
      `SELECT COUNT(*) FILTER (WHERE NOT balanceado)::int AS descuadrados,
              COUNT(*) FILTER (WHERE lineas = 0)::int     AS sin_movimientos,
              COALESCE(SUM(total_debe), 0)  AS total_debe,
              COALESCE(SUM(total_haber), 0) AS total_haber
         FROM contabilidad.v_asiento_integridad
        WHERE fecha_transaccion BETWEEN $1::date AND $2::date`,
      [periodo.fecha_inicio, periodo.fecha_fin],
    )) as Array<Record<string, unknown>>;

    const descuadrados = Number(pendientes?.descuadrados ?? 0);
    const sinMovimientos = Number(pendientes?.sin_movimientos ?? 0);

    if (descuadrados > 0 || sinMovimientos > 0) {
      throw new ConflictException(
        `No se puede cerrar el periodo ${periodo.codigo}: hay ${descuadrados} asiento(s) descuadrado(s) ` +
          `y ${sinMovimientos} asiento(s) sin movimientos. Corrígelos antes del cierre.`,
      );
    }

    const [cerrado] = (await this.dataSource.query(
      `UPDATE contabilidad.periodo_contable
          SET estado = 'CERRADO',
              fecha_cierre = now(),
              id_usuario_cierre = $2,
              fecha_modificacion = now(),
              id_usuario_modificacion = $2,
              version_registro = COALESCE(version_registro, 1) + 1
        WHERE id_periodo = $1
        RETURNING id_periodo, codigo, estado, fecha_cierre`,
      [periodo.id_periodo, authUserId || null],
    )) as Array<Record<string, unknown>>;

    return {
      success: true,
      message: `Periodo ${periodo.codigo} cerrado correctamente.`,
      data: {
        periodo: cerrado,
        verificacion: {
          totalDebe: toImporte(pendientes?.total_debe),
          totalHaber: toImporte(pendientes?.total_haber),
          cuadrado: toImporte(pendientes?.total_debe) === toImporte(pendientes?.total_haber),
        },
      },
    };
  }

  /** La reapertura exige motivo y queda auditada; es la operación más restringida. */
  async reabrir(idPeriodo: string, body: Record<string, unknown>, authUserId?: string) {
    const periodo = await this.buscarPeriodo(idPeriodo);
    const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : '';

    if (!motivo) {
      throw new BadRequestException('motivo es obligatorio para reabrir un periodo contable.');
    }

    if (periodo.estado !== 'CERRADO') {
      throw new ConflictException(
        `Solo se reabren periodos cerrados. El periodo ${periodo.codigo} está ${periodo.estado}.`,
      );
    }

    const [reabierto] = (await this.dataSource.query(
      `UPDATE contabilidad.periodo_contable
          SET estado = 'REABIERTO',
              motivo_reapertura = $2,
              fecha_reapertura = now(),
              id_usuario_reapertura = $3,
              fecha_modificacion = now(),
              id_usuario_modificacion = $3,
              version_registro = COALESCE(version_registro, 1) + 1
        WHERE id_periodo = $1
        RETURNING id_periodo, codigo, estado, motivo_reapertura, fecha_reapertura`,
      [periodo.id_periodo, motivo, authUserId || null],
    )) as Array<Record<string, unknown>>;

    return {
      success: true,
      message: `Periodo ${periodo.codigo} reabierto.`,
      data: reabierto,
    };
  }

  private async buscarPeriodo(idPeriodo: string): Promise<Record<string, any>> {
    const id = Number(idPeriodo);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('id_periodo debe ser un entero positivo.');
    }

    const [periodo] = (await this.dataSource.query(
      `SELECT id_periodo, codigo, estado, fecha_inicio, fecha_fin
         FROM contabilidad.periodo_contable
        WHERE id_periodo = $1
          AND LOWER(COALESCE(estado_registro, 'Activo')) = 'activo'
        LIMIT 1`,
      [id],
    )) as Array<Record<string, unknown>>;

    if (!periodo) throw new NotFoundException(`No existe el periodo contable ${id}.`);
    return periodo;
  }
}
