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
