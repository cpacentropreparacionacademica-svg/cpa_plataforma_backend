import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ResourceConfig } from '../../modules/resource-registry';
import { quoteIdentifier, quoteTable } from '../utils/sql.util';
import { ResourceMetadataService } from '../services/resource-metadata.service';
import { toHttpDatabaseException } from '../utils/database-error.util';

const CONTROL_QUERY_FIELDS = new Set(['page', 'limit', 'offset', 'search', 'orderBy', 'orderDir']);
const PROTECTED_SYSTEM_FIELDS = new Set([
  'fecha_registro',
  'fecha_modificacion',
  'version_registro',
  'id_usuario_creador',
  'id_usuario_modificacion',
  'user_id_creacion',
  'user_id_modificacion',
  'created_at',
  'updated_at',
  'deleted_at',
]);

export interface ListResult {
  count: number;
  rows: Record<string, unknown>[];
  limit: number;
  offset: number;
}

@Injectable()
export class CrudRepository {
  constructor(private readonly dataSource: DataSource, private readonly metadata: ResourceMetadataService) {}

  async create(resource: ResourceConfig, payload: Record<string, unknown>, authUserId?: string): Promise<Record<string, unknown>> {
    try {
      return await this.insertOne(this.dataSource.manager, resource, payload, authUserId);
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async createMany(resource: ResourceConfig, payloads: Record<string, unknown>[], authUserId?: string): Promise<Record<string, unknown>[]> {
    if (!Array.isArray(payloads) || payloads.length === 0) {
      throw new BadRequestException('El batch debe contener un arreglo items con al menos un registro.');
    }

    if (payloads.length > 200) {
      throw new BadRequestException('El batch no puede superar 200 registros por solicitud.');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const rows: Record<string, unknown>[] = [];
        for (const payload of payloads) {
          rows.push(await this.insertOne(manager, resource, payload, authUserId));
        }
        return rows;
      });
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async update(resource: ResourceConfig, idValues: Record<string, unknown>, payload: Record<string, unknown>, authUserId?: string): Promise<Record<string, unknown>> {
    try {
      return await this.updateOne(this.dataSource.manager, resource, idValues, payload, authUserId);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async updateMany(
    resource: ResourceConfig,
    items: Array<{ ids: Record<string, unknown>; data: Record<string, unknown> }>,
    authUserId?: string,
  ): Promise<Record<string, unknown>[]> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('El batch debe contener un arreglo items con al menos un registro.');
    }

    if (items.length > 200) {
      throw new BadRequestException('El batch no puede superar 200 registros por solicitud.');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const rows: Record<string, unknown>[] = [];
        for (const item of items) {
          rows.push(await this.updateOne(manager, resource, item.ids, item.data, authUserId));
        }
        return rows;
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async get(resource: ResourceConfig, idValues: Record<string, unknown>): Promise<Record<string, unknown>> {
    const table = quoteTable(resource.schema, resource.tableName);
    const where = this.buildWhereSql(resource, idValues, 1);
    const rows = await this.dataSource.query(`SELECT * FROM ${table} WHERE ${where.sql} LIMIT 1`, where.values) as Record<string, unknown>[];
    if (!rows[0]) throw new NotFoundException(`No se encontró el registro de ${resource.entity}.`);
    return rows[0];
  }

  async list(resource: ResourceConfig, query: Record<string, unknown>): Promise<ListResult> {
    const columnNames = await this.metadata.getColumnNames(resource);
    const table = quoteTable(resource.schema, resource.tableName);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const page = Number(query.page || 1);
    const offset = query.offset !== undefined ? Math.max(Number(query.offset), 0) : Math.max(page - 1, 0) * limit;
    const filters: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(query)) {
      if (CONTROL_QUERY_FIELDS.has(key) || value === undefined || value === null || value === '') continue;
      if (!columnNames.has(key)) continue;

      values.push(value);
      const paramIndex = values.length;

      // estado_registro históricamente se guardó como 'Activo', 'ACTIVO' o 'activo'.
      // El frontend puede enviar cualquiera; el listado no debe ocultar registros por mayúsculas/minúsculas.
      if (key === 'estado_registro' && typeof value === 'string') {
        filters.push(`LOWER(${quoteIdentifier(key)}) = LOWER($${paramIndex})`);
        continue;
      }

      filters.push(`${quoteIdentifier(key)} = $${paramIndex}`);
    }

    const whereSql = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const orderBy = typeof query.orderBy === 'string' && columnNames.has(query.orderBy) ? query.orderBy : resource.primaryKeys[0];
    const orderDir = String(query.orderDir || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const countRows = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM ${table} ${whereSql}`, values) as Array<{ count: number }>;
    const rows = await this.dataSource.query(
      `SELECT * FROM ${table} ${whereSql} ORDER BY ${quoteIdentifier(orderBy)} ${orderDir} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    ) as Record<string, unknown>[];

    return { count: countRows[0]?.count || 0, rows, limit, offset };
  }

  private async insertOne(
    manager: EntityManager,
    resource: ResourceConfig,
    payload: Record<string, unknown>,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const columnNames = await this.metadata.getColumnNames(resource);
    const cleanPayload = this.cleanPayload(payload, columnNames, false);

    if (authUserId && columnNames.has('id_usuario_creador') && cleanPayload.id_usuario_creador === undefined) {
      cleanPayload.id_usuario_creador = authUserId;
    }

    if (Object.keys(cleanPayload).length === 0) {
      throw new BadRequestException('No existen campos válidos para crear el registro.');
    }

    const fields = Object.keys(cleanPayload);
    const table = quoteTable(resource.schema, resource.tableName);
    const columns = fields.map(quoteIdentifier).join(', ');
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const values = fields.map((field) => cleanPayload[field]);

    const rows = await manager.query(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    ) as Record<string, unknown>[];

    return rows[0];
  }

  private async updateOne(
    manager: EntityManager,
    resource: ResourceConfig,
    idValues: Record<string, unknown>,
    payload: Record<string, unknown>,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const columnNames = await this.metadata.getColumnNames(resource);
    const cleanPayload = this.cleanPayload(payload, columnNames, true);

    for (const primaryKey of resource.primaryKeys) {
      delete cleanPayload[primaryKey];
    }

    if (authUserId && columnNames.has('id_usuario_modificacion') && cleanPayload.id_usuario_modificacion === undefined) {
      cleanPayload.id_usuario_modificacion = authUserId;
    }

    if (columnNames.has('fecha_modificacion') && cleanPayload.fecha_modificacion === undefined) {
      cleanPayload.fecha_modificacion = new Date();
    }

    if (Object.keys(cleanPayload).length === 0) {
      throw new BadRequestException('No existen campos válidos para actualizar el registro.');
    }

    const fields = Object.keys(cleanPayload);
    const table = quoteTable(resource.schema, resource.tableName);
    const setSql = fields.map((field, index) => `${quoteIdentifier(field)} = $${index + 1}`).join(', ');
    const values = fields.map((field) => cleanPayload[field]);
    const where = this.buildWhereSql(resource, idValues, values.length + 1);

    const rows = await manager.query(
      `UPDATE ${table} SET ${setSql} WHERE ${where.sql} RETURNING *`,
      [...values, ...where.values],
    ) as Record<string, unknown>[];

    if (!rows[0]) throw new NotFoundException(`No se encontró el registro de ${resource.entity}.`);
    return rows[0];
  }

  private cleanPayload(payload: Record<string, unknown>, columnNames: Set<string>, stripProtected: boolean): Record<string, unknown> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('El cuerpo de la solicitud debe ser un objeto JSON válido.');
    }

    return Object.entries(payload).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (!columnNames.has(key)) return acc;
      if (stripProtected && PROTECTED_SYSTEM_FIELDS.has(key)) return acc;
      if (value === undefined) return acc;
      acc[key] = value;
      return acc;
    }, {});
  }

  private buildWhereSql(resource: ResourceConfig, idValues: Record<string, unknown>, startIndex: number): { sql: string; values: unknown[] } {
    const values: unknown[] = [];
    const clauses = resource.primaryKeys.map((primaryKey, index) => {
      const value = idValues[primaryKey];
      if (value === undefined || value === null || value === '') {
        throw new BadRequestException(`El identificador ${primaryKey} es obligatorio.`);
      }
      values.push(value);
      return `${quoteIdentifier(primaryKey)} = $${startIndex + index}`;
    });

    return { sql: clauses.join(' AND '), values };
  }
}
