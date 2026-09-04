import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface AsientoMovimiento {
  id_cuenta: number;
  debe: number;
  haber: number;
}

const ESTADOS_ACTIVOS = "('Activo', 'ACTIVO', 'activo')";

/** Redondea a dos decimales y rechaza importes no numéricos. */
export function toMoneyNumber(value: unknown): number {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) {
    throw new BadRequestException('Los importes deben ser numéricos.');
  }
  return Math.round(numberValue * 100) / 100;
}

export function sumMovimientos(
  movimientos: Array<{ debe?: unknown; haber?: unknown }>,
): { debe: number; haber: number } {
  const debe = movimientos.reduce((total, movement) => total + toMoneyNumber(movement.debe), 0);
  const haber = movimientos.reduce((total, movement) => total + toMoneyNumber(movement.haber), 0);
  return { debe: Math.round(debe * 100) / 100, haber: Math.round(haber * 100) / 100 };
}

/**
 * La base de datos también valida el balance con un constraint trigger diferido,
 * pero comprobarlo antes de escribir permite devolver un 400 explicativo en vez
 * de que el rollback llegue al COMMIT con un mensaje de PostgreSQL.
 */
export function assertBalanced(movimientos: AsientoMovimiento[]): void {
  const totals = sumMovimientos(movimientos);
  if (Math.abs(totals.debe - totals.haber) > 0.009) {
    throw new BadRequestException(`El asiento no está balanceado. Debe=${totals.debe}, Haber=${totals.haber}.`);
  }
}

export function toOptionalPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function toOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export async function insertMovimiento(
  manager: EntityManager,
  idTransaccion: number,
  movimiento: AsientoMovimiento,
  authUserId?: string,
): Promise<Record<string, unknown>> {
  const rows = (await manager.query(
    `INSERT INTO contabilidad.transaccion_movimiento_cuenta
      (id_transaccion, id_cuenta, debe, haber, id_usuario_creador)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [idTransaccion, movimiento.id_cuenta, movimiento.debe, movimiento.haber, authUserId || null],
  )) as Record<string, unknown>[];

  return rows[0];
}

/**
 * Resuelve una cuenta operativa configurable. La prioridad es: id explícito del
 * payload, código explícito, configuración activa y, como último recurso, el
 * código por defecto del plan de cuentas.
 */
export async function resolveCuentaOperativaId(
  manager: EntityManager,
  codigoConfiguracion: string,
  defaultCode: string,
  label: string,
  explicitId?: unknown,
  explicitCode?: unknown,
): Promise<number> {
  const id = toOptionalPositiveInt(explicitId);
  if (id) return id;

  const code = toOptionalString(explicitCode);
  if (code) return resolveCuentaIdByCode(manager, code, label);

  const configRows = (await manager.query(
    `SELECT cco.id_cuenta
       FROM contabilidad.configuracion_cuenta_operativa cco
       JOIN contabilidad.cuenta c ON c.id_cuenta = cco.id_cuenta
      WHERE cco.codigo = $1
        AND COALESCE(cco.estado_registro, 'Activo') IN ${ESTADOS_ACTIVOS}
        AND COALESCE(c.estado_registro, 'Activo') IN ${ESTADOS_ACTIVOS}
      LIMIT 1`,
    [codigoConfiguracion],
  )) as Array<{ id_cuenta: unknown }>;

  const configuredId = toOptionalPositiveInt(configRows[0]?.id_cuenta);
  if (configuredId) return configuredId;

  return resolveCuentaIdByCode(manager, defaultCode, `${label} (configuración ${codigoConfiguracion} ausente)`);
}

export async function resolveCuentaIdByCode(
  manager: EntityManager,
  codigo: string,
  label: string,
): Promise<number> {
  const rows = (await manager.query(
    `SELECT id_cuenta FROM contabilidad.cuenta
      WHERE codigo = $1 AND COALESCE(estado_registro, 'Activo') IN ${ESTADOS_ACTIVOS}
      LIMIT 1`,
    [codigo],
  )) as Array<{ id_cuenta: unknown }>;

  const id = toOptionalPositiveInt(rows[0]?.id_cuenta);
  if (!id) {
    throw new BadRequestException(
      `No se encontró ${label}. Código buscado: ${codigo}. Configúralo en cuentas operativas o envía id_cuenta explícito.`,
    );
  }
  return id;
}
