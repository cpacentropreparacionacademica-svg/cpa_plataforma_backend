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

// Recursos "hijos" de persona (estudiante, tutor, usuario): esquema/tabla de la persona base
// y columnas editables que se exponen en lectura y se aceptan en update. Ninguna de estas
// columnas existe en las tablas hijas, por lo que el split de payload es inequívoco.
const PERSONA_JOIN_SCHEMA = 'persona';
const PERSONA_JOIN_TABLE = 'persona';
const PERSONA_JOIN_COLUMNS = ['nombres', 'apellidos', 'telefono', 'fecha_nacimiento', 'email'] as const;
const PERSONA_METADATA_RESOURCE = { schema: PERSONA_JOIN_SCHEMA, tableName: PERSONA_JOIN_TABLE } as ResourceConfig;

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
      // El update de un recurso hijo de persona toca dos tablas (hijo + persona): se
      // ejecuta en una transacción para que ambos cambios sean atómicos.
      if (resource.personaJoin) {
        return await this.dataSource.transaction((manager) => this.updateOne(manager, resource, idValues, payload, authUserId));
      }
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

    if (resource.personaJoin) {
      const where = this.buildWhereSql(resource, idValues, 1, 'c');
      const rows = await this.dataSource.query(
        `SELECT c.*, ${this.personaSelectColumns()} FROM ${table} c ${this.personaJoinClause(resource)} WHERE ${where.sql} LIMIT 1`,
        where.values,
      ) as Record<string, unknown>[];
      if (!rows[0]) throw new NotFoundException(`No se encontró el registro de ${resource.entity}.`);
      return rows[0];
    }

    const where = this.buildWhereSql(resource, idValues, 1);
    const rows = await this.dataSource.query(`SELECT * FROM ${table} WHERE ${where.sql} LIMIT 1`, where.values) as Record<string, unknown>[];
    if (!rows[0]) throw new NotFoundException(`No se encontró el registro de ${resource.entity}.`);
    return rows[0];
  }

  async list(resource: ResourceConfig, query: Record<string, unknown>): Promise<ListResult> {
    const columnNames = await this.metadata.getColumnNames(resource);
    const table = quoteTable(resource.schema, resource.tableName);
    // Cuando el recurso es hijo de persona, la tabla hija se aliasa como "c" para poder
    // unir la persona base ("p"); las columnas del hijo deben cualificarse para evitar
    // ambigüedad (p. ej. id_persona/estado_registro existen en ambas tablas).
    const alias = resource.personaJoin ? 'c' : '';
    const qualify = (column: string) => (alias ? `${alias}.${quoteIdentifier(column)}` : quoteIdentifier(column));
    // Los aliases lógicos, por ejemplo infraestructura/aula, pueden imponer filtros
    // no editables por frontend. Esto evita exponer salas cuando la pantalla pide aulas.
    const effectiveQuery: Record<string, unknown> = { ...query, ...(resource.defaultFilters || {}) };
    const limit = Math.min(Math.max(Number(effectiveQuery.limit || 20), 1), 100);
    const page = Number(effectiveQuery.page || 1);
    const offset = effectiveQuery.offset !== undefined ? Math.max(Number(effectiveQuery.offset), 0) : Math.max(page - 1, 0) * limit;
    const filters: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(effectiveQuery)) {
      if (CONTROL_QUERY_FIELDS.has(key) || value === undefined || value === null || value === '') continue;
      if (!columnNames.has(key)) continue;

      values.push(value);
      const paramIndex = values.length;

      // estado_registro históricamente se guardó como 'Activo', 'ACTIVO' o 'activo'.
      // El frontend puede enviar cualquiera; el listado no debe ocultar registros por mayúsculas/minúsculas.
      if (key === 'estado_registro' && typeof value === 'string') {
        filters.push(`LOWER(${qualify(key)}) = LOWER($${paramIndex})`);
        continue;
      }

      filters.push(`${qualify(key)} = $${paramIndex}`);
    }

    const whereSql = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const orderBy = typeof effectiveQuery.orderBy === 'string' && columnNames.has(effectiveQuery.orderBy) ? effectiveQuery.orderBy : resource.primaryKeys[0];
    const orderDir = String(effectiveQuery.orderDir || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const selectColumns = resource.personaJoin ? `c.*, ${this.personaSelectColumns()}` : '*';
    const fromSql = resource.personaJoin ? `${table} c ${this.personaJoinClause(resource)}` : `${table}`;
    const countFromSql = resource.personaJoin ? `${table} c` : `${table}`;

    const countRows = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM ${countFromSql} ${whereSql}`, values) as Array<{ count: number }>;
    const rows = await this.dataSource.query(
      `SELECT ${selectColumns} FROM ${fromSql} ${whereSql} ORDER BY ${qualify(orderBy)} ${orderDir} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
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
    const cleanPayload = this.cleanPayload({ ...payload, ...(resource.defaultCreateValues || {}) }, columnNames, false);

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
    if (resource.personaJoin) {
      return this.updatePersonaChild(manager, resource, idValues, payload, authUserId);
    }

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

  /**
   * Update de un recurso hijo de persona (estudiante, tutor, usuario). Divide el payload:
   * los campos de persona (nombres, apellidos, etc.) actualizan persona.persona; el resto,
   * la tabla hija. Ambos writes ocurren con el mismo `manager` (transacción). Devuelve el
   * registro hijo combinado con los datos actuales de persona.
   */
  private async updatePersonaChild(
    manager: EntityManager,
    resource: ResourceConfig,
    idValues: Record<string, unknown>,
    payload: Record<string, unknown>,
    authUserId?: string,
  ): Promise<Record<string, unknown>> {
    const childColumns = await this.metadata.getColumnNames(resource);
    const childClean = this.cleanPayload(payload, childColumns, true);
    for (const primaryKey of resource.primaryKeys) {
      delete childClean[primaryKey];
    }

    // Campos de persona presentes en el payload. No se solapan con columnas del hijo.
    const personaClean: Record<string, unknown> = {};
    for (const column of PERSONA_JOIN_COLUMNS) {
      const value = payload[column];
      if (value !== undefined && !childColumns.has(column)) personaClean[column] = value;
    }

    const hasChildChanges = Object.keys(childClean).length > 0;
    const hasPersonaChanges = Object.keys(personaClean).length > 0;
    if (!hasChildChanges && !hasPersonaChanges) {
      throw new BadRequestException('No existen campos válidos para actualizar el registro.');
    }

    const table = quoteTable(resource.schema, resource.tableName);

    // Actualiza (o localiza) la fila hija para conocer el id_persona y devolver el registro.
    let childRow: Record<string, unknown> | undefined;
    if (hasChildChanges) {
      if (authUserId && childColumns.has('id_usuario_modificacion') && childClean.id_usuario_modificacion === undefined) {
        childClean.id_usuario_modificacion = authUserId;
      }
      if (childColumns.has('fecha_modificacion') && childClean.fecha_modificacion === undefined) {
        childClean.fecha_modificacion = new Date();
      }
      const fields = Object.keys(childClean);
      const setSql = fields.map((field, index) => `${quoteIdentifier(field)} = $${index + 1}`).join(', ');
      const values = fields.map((field) => childClean[field]);
      const where = this.buildWhereSql(resource, idValues, values.length + 1);
      const rows = await manager.query(`UPDATE ${table} SET ${setSql} WHERE ${where.sql} RETURNING *`, [...values, ...where.values]) as Record<string, unknown>[];
      childRow = rows[0];
    } else {
      const where = this.buildWhereSql(resource, idValues, 1);
      const rows = await manager.query(`SELECT * FROM ${table} WHERE ${where.sql} LIMIT 1`, where.values) as Record<string, unknown>[];
      childRow = rows[0];
    }

    if (!childRow) throw new NotFoundException(`No se encontró el registro de ${resource.entity}.`);

    const idPersona = childRow[resource.personaJoin!.personaFkColumn];
    const personaTable = quoteTable(PERSONA_JOIN_SCHEMA, PERSONA_JOIN_TABLE);
    const personaReturning = PERSONA_JOIN_COLUMNS.map((column) => quoteIdentifier(column)).join(', ');

    if (hasPersonaChanges && idPersona !== undefined && idPersona !== null) {
      const personaColumns = await this.metadata.getColumnNames(PERSONA_METADATA_RESOURCE);
      if (authUserId && personaColumns.has('id_usuario_modificacion')) personaClean.id_usuario_modificacion = authUserId;
      if (personaColumns.has('fecha_modificacion')) personaClean.fecha_modificacion = new Date();

      const fields = Object.keys(personaClean).filter((field) => personaColumns.has(field));
      const setSql = fields.map((field, index) => `${quoteIdentifier(field)} = $${index + 1}`).join(', ');
      const values = fields.map((field) => personaClean[field]);
      const personaRows = await manager.query(
        `UPDATE ${personaTable} SET ${setSql} WHERE ${quoteIdentifier('id_persona')} = $${values.length + 1} RETURNING ${personaReturning}`,
        [...values, idPersona],
      ) as Record<string, unknown>[];
      if (personaRows[0]) return { ...childRow, ...personaRows[0] };
    }

    // Sin cambios de persona (o sin id_persona): devuelve el hijo con los datos actuales de persona.
    if (idPersona !== undefined && idPersona !== null) {
      const personaRows = await manager.query(
        `SELECT ${personaReturning} FROM ${personaTable} WHERE ${quoteIdentifier('id_persona')} = $1 LIMIT 1`,
        [idPersona],
      ) as Record<string, unknown>[];
      if (personaRows[0]) return { ...childRow, ...personaRows[0] };
    }

    return childRow;
  }

  private personaSelectColumns(): string {
    return PERSONA_JOIN_COLUMNS.map((column) => `p.${quoteIdentifier(column)}`).join(', ');
  }

  private personaJoinClause(resource: ResourceConfig): string {
    const personaTable = quoteTable(PERSONA_JOIN_SCHEMA, PERSONA_JOIN_TABLE);
    const fkColumn = quoteIdentifier(resource.personaJoin!.personaFkColumn);
    return `LEFT JOIN ${personaTable} p ON p.${quoteIdentifier('id_persona')} = c.${fkColumn}`;
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

  private buildWhereSql(resource: ResourceConfig, idValues: Record<string, unknown>, startIndex: number, alias?: string): { sql: string; values: unknown[] } {
    const values: unknown[] = [];
    const clauses = resource.primaryKeys.map((primaryKey, index) => {
      const value = idValues[primaryKey];
      if (value === undefined || value === null || value === '') {
        throw new BadRequestException(`El identificador ${primaryKey} es obligatorio.`);
      }
      values.push(value);
      const column = alias ? `${alias}.${quoteIdentifier(primaryKey)}` : quoteIdentifier(primaryKey);
      return `${column} = $${startIndex + index}`;
    });

    return { sql: clauses.join(' AND '), values };
  }
}
