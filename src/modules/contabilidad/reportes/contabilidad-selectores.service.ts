import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const LIMITE_SELECTOR = 50;

/**
 * Selectores para combos del frontend.
 *
 * Devuelven un DTO mínimo (id, código, etiqueta) y limitan siempre el resultado. El
 * frontend descargaba el plan de cuentas completo paginando de 500 en 500 hasta 5.000
 * registros para llenar un desplegable; estos endpoints buscan en base de datos.
 */
@Injectable()
export class ContabilidadSelectoresService {
  constructor(private readonly dataSource: DataSource) {}

  async buscarCuentas(query: Record<string, unknown>) {
    const termino = typeof query.q === 'string' ? query.q.trim() : '';
    const incluirInactivas = String(query.incluirInactivas ?? 'false') === 'true';
    const patron = termino ? `%${termino.toLowerCase()}%` : null;

    const cuentas = (await this.dataSource.query(
      `SELECT id_cuenta, codigo, nombre_cuenta, tipo_reporte, sub_tipo, naturaleza_saldo
         FROM contabilidad.v_plan_cuentas
        WHERE ($1::boolean OR LOWER(COALESCE(estado_registro, 'Activo')) = 'activo')
          AND (
            $2::text IS NULL
            OR LOWER(codigo)        LIKE $2::text
            OR LOWER(nombre_cuenta) LIKE $2::text
          )
        ORDER BY codigo ASC
        LIMIT $3`,
      [incluirInactivas, patron, LIMITE_SELECTOR],
    )) as Array<Record<string, unknown>>;

    return {
      items: cuentas.map((cuenta) => ({
        id: Number(cuenta.id_cuenta),
        code: cuenta.codigo,
        label: `${cuenta.codigo} · ${cuenta.nombre_cuenta}`,
        tipoReporte: cuenta.tipo_reporte,
        subTipo: cuenta.sub_tipo,
        naturaleza: cuenta.naturaleza_saldo,
      })),
      limite: LIMITE_SELECTOR,
      truncado: cuentas.length === LIMITE_SELECTOR,
    };
  }
}
