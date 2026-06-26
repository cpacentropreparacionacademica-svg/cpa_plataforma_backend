import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { CrudRepository } from '../../common/repositories/crud.repository';
import { getResourceConfig, ResourceConfig } from '../resource-registry';

@Injectable()
export class CrudService {
  constructor(
    private readonly repository: CrudRepository,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  findResource(moduleName: string, resourcePath: string): ResourceConfig {
    const resource = getResourceConfig(moduleName, resourcePath);
    if (!resource) {
      throw new NotFoundException(`Recurso no encontrado: ${moduleName}/${resourcePath}.`);
    }
    return resource;
  }

  async create(moduleName: string, resourcePath: string, payload: Record<string, unknown>, authUserId?: string) {
    const resource = this.findResource(moduleName, resourcePath);
    this.assertWriteAllowedForSmoke('POST', resource);
    const data = await this.repository.create(resource, payload, authUserId);
    await this.provisionAccountingAccountsAfterCreate(resource, data, authUserId);
    return { success: true, message: `${resource.entity} creado correctamente.`, data };
  }

  async createBatch(moduleName: string, resourcePath: string, payload: unknown, authUserId?: string) {
    const resource = this.findResource(moduleName, resourcePath);
    this.assertWriteAllowedForSmoke('POST', resource);
    const items = this.normalizeCreateBatchPayload(payload);
    const data = await this.repository.createMany(resource, items, authUserId);
    for (const row of data) {
      await this.provisionAccountingAccountsAfterCreate(resource, row, authUserId);
    }
    return {
      success: true,
      message: `${data.length} registro(s) de ${resource.entity} creados correctamente.`,
      data,
      count: data.length,
    };
  }

  async update(moduleName: string, resourcePath: string, ids: string[], payload: Record<string, unknown>, authUserId?: string) {
    const resource = this.findResource(moduleName, resourcePath);
    const idValues = this.mapIds(resource, ids);
    this.assertWriteAllowedForSmoke('UPDATE', resource);
    const data = await this.repository.update(resource, idValues, payload, authUserId);
    return { success: true, message: `${resource.entity} actualizado correctamente.`, data };
  }

  async updateBatch(moduleName: string, resourcePath: string, payload: unknown, authUserId?: string) {
    const resource = this.findResource(moduleName, resourcePath);
    this.assertWriteAllowedForSmoke('UPDATE', resource);
    const items = this.normalizeUpdateBatchPayload(resource, payload);
    const data = await this.repository.updateMany(resource, items, authUserId);
    return {
      success: true,
      message: `${data.length} registro(s) de ${resource.entity} actualizados correctamente.`,
      data,
      count: data.length,
    };
  }

  async get(moduleName: string, resourcePath: string, ids: string[]) {
    const resource = this.findResource(moduleName, resourcePath);
    const idValues = this.mapIds(resource, ids);
    const data = await this.repository.get(resource, idValues);
    return { success: true, message: `${resource.entity} obtenido correctamente.`, data };
  }

  async list(moduleName: string, resourcePath: string, query: Record<string, unknown>) {
    const resource = this.findResource(moduleName, resourcePath);
    const result = await this.repository.list(resource, query);
    const page = result.limit > 0 ? Math.floor(result.offset / result.limit) + 1 : 1;
    const rows = result.rows;
    const pagination = {
      count: result.count,
      total: result.count,
      limit: result.limit,
      offset: result.offset,
      page,
      pages: result.limit > 0 ? Math.ceil(result.count / result.limit) : 1,
    };

    /**
     * Contrato corregido para el frontend:
     * - Por defecto `data` vuelve a ser directamente el arreglo de registros.
     *   Esto permite que el front haga `response.data.data.map(...)` sin romperse.
     * - Para compatibilidad técnica, también se mantienen `rows`, `items`, `records`,
     *   `count`, `total`, `pagination` y `meta` en la raíz de la respuesta.
     * - Si alguna herramienta vieja necesita el objeto anterior `{ count, rows, limit, offset }`,
     *   puede pedirlo con `?dataShape=legacy` o `?format=legacy`.
     */
    const dataShape = String(query.dataShape || query.format || '').toLowerCase();
    const legacyData = {
      count: result.count,
      rows,
      items: rows,
      records: rows,
      limit: result.limit,
      offset: result.offset,
      page,
      total: result.count,
      pagination,
    };
    const shouldReturnLegacyData = dataShape === 'legacy' || dataShape === 'object' || dataShape === 'rows';

    return {
      success: true,
      message: `${resource.entity} listado correctamente.`,
      data: shouldReturnLegacyData ? legacyData : rows,
      rows,
      items: rows,
      records: rows,
      count: result.count,
      total: result.count,
      limit: result.limit,
      offset: result.offset,
      page,
      pagination,
      meta: pagination,
    };
  }


  private normalizeCreateBatchPayload(payload: unknown): Record<string, unknown>[] {
    const candidate = Array.isArray(payload) ? payload : (payload as { items?: unknown })?.items;

    if (!Array.isArray(candidate) || candidate.length === 0) {
      throw new BadRequestException('El batch de creación debe enviarse como arreglo o como { items: [...] }.');
    }

    return candidate.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new BadRequestException(`El item ${index + 1} del batch debe ser un objeto JSON.`);
      }
      return item as Record<string, unknown>;
    });
  }

  private normalizeUpdateBatchPayload(resource: ResourceConfig, payload: unknown): Array<{ ids: Record<string, unknown>; data: Record<string, unknown> }> {
    const candidate = Array.isArray(payload) ? payload : (payload as { items?: unknown })?.items;

    if (!Array.isArray(candidate) || candidate.length === 0) {
      throw new BadRequestException('El batch de actualización debe enviarse como arreglo o como { items: [...] }.');
    }

    return candidate.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new BadRequestException(`El item ${index + 1} del batch debe ser un objeto JSON.`);
      }

      const source = item as Record<string, unknown>;
      const idsSource = (source.ids && typeof source.ids === 'object' && !Array.isArray(source.ids))
        ? source.ids as Record<string, unknown>
        : source;
      const dataSource = (source.data && typeof source.data === 'object' && !Array.isArray(source.data))
        ? source.data as Record<string, unknown>
        : source;

      const ids = resource.primaryKeys.reduce<Record<string, unknown>>((acc, primaryKey) => {
        acc[primaryKey] = idsSource[primaryKey];
        return acc;
      }, {});

      return { ids, data: dataSource };
    });
  }


  private async provisionAccountingAccountsAfterCreate(
    resource: ResourceConfig,
    row: Record<string, unknown>,
    authUserId?: string,
  ): Promise<void> {
    if (resource.schema === 'persona' && resource.tableName === 'persona_estudiante') {
      const idEstudiante = this.toOptionalPositiveInt(row.id_persona);
      if (idEstudiante) await this.ensureStudentAccountingAccounts(idEstudiante, authUserId);
      return;
    }

    if (resource.schema === 'persona' && resource.tableName === 'persona_tutor') {
      const idTutor = this.toOptionalPositiveInt(row.id_tutor);
      if (idTutor) await this.ensureTutorAccountingAccounts(idTutor, authUserId);
    }
  }

  private async ensureStudentAccountingAccounts(idEstudiante: number, authUserId?: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const estudianteRows = await manager.query(
        `SELECT pe.id_persona,
                COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.nombres, p.apellidos)), ''), 'Estudiante ' || pe.id_persona::text) AS nombre_completo
           FROM persona.persona_estudiante pe
           LEFT JOIN persona.persona p ON p.id_persona = pe.id_persona
          WHERE pe.id_persona = $1
          LIMIT 1`,
        [idEstudiante],
      ) as Array<{ id_persona: unknown; nombre_completo: unknown }>;

      if (!estudianteRows[0]) return;
      const nombre = String(estudianteRows[0].nombre_completo || `Estudiante ${idEstudiante}`).slice(0, 120);

      const idCuentaCxc = await this.ensureCuentaByGroupCode(
        manager,
        '1.1.03',
        `1.1.03.E${idEstudiante}`,
        `CxC estudiante ${idEstudiante} - ${nombre}`,
        authUserId,
      );
      await this.ensureCuentaAsignacion(manager, 'ESTUDIANTE_CXC', idCuentaCxc, { id_persona_estudiante: idEstudiante }, authUserId);

      const idCuentaPaquete = await this.ensureCuentaByGroupCode(
        manager,
        '2.1.06',
        `2.1.06.E${idEstudiante}`,
        `Paquetes cobrados por anticipado estudiante ${idEstudiante} - ${nombre}`,
        authUserId,
      );
      await this.ensureCuentaAsignacion(manager, 'ESTUDIANTE_PAQUETE_DIFERIDO', idCuentaPaquete, { id_persona_estudiante: idEstudiante }, authUserId);
    });
  }

  private async ensureTutorAccountingAccounts(idTutor: number, authUserId?: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const tutorRows = await manager.query(
        `SELECT pt.id_tutor,
                COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.nombres, p.apellidos)), ''), 'Tutor ' || pt.id_tutor::text) AS nombre_completo
           FROM persona.persona_tutor pt
           LEFT JOIN persona.persona p ON p.id_persona = pt.id_persona
          WHERE pt.id_tutor = $1
          LIMIT 1`,
        [idTutor],
      ) as Array<{ id_tutor: unknown; nombre_completo: unknown }>;

      if (!tutorRows[0]) return;
      const nombre = String(tutorRows[0].nombre_completo || `Tutor ${idTutor}`).slice(0, 120);
      const idCuentaTutor = await this.ensureCuentaByGroupCode(
        manager,
        '2.1.03',
        `2.1.03.T${idTutor}`,
        `CxP tutor ${idTutor} - ${nombre}`,
        authUserId,
      );
      await this.ensureCuentaAsignacion(manager, 'TUTOR_CXP', idCuentaTutor, { id_persona_tutor: idTutor }, authUserId);
    });
  }

  private async ensureCuentaByGroupCode(
    manager: EntityManager,
    codigoGrupo: string,
    codigoCuenta: string,
    nombreCuenta: string,
    authUserId?: string,
  ): Promise<number> {
    const existing = await manager.query(
      `SELECT id_cuenta FROM contabilidad.cuenta WHERE codigo = $1 LIMIT 1`,
      [codigoCuenta],
    ) as Array<{ id_cuenta: unknown }>;
    const existingId = this.toOptionalPositiveInt(existing[0]?.id_cuenta);
    if (existingId) return existingId;

    const groupRows = await manager.query(
      `SELECT id_grupo_cuenta FROM contabilidad.grupo_cuenta WHERE codigo = $1 LIMIT 1`,
      [codigoGrupo],
    ) as Array<{ id_grupo_cuenta: unknown }>;
    const idGrupo = this.toOptionalPositiveInt(groupRows[0]?.id_grupo_cuenta);
    if (!idGrupo) {
      throw new BadRequestException(`No existe el grupo contable ${codigoGrupo}; no se pudo crear la cuenta ${codigoCuenta}.`);
    }

    const rows = await manager.query(
      `INSERT INTO contabilidad.cuenta
        (codigo, nombre_cuenta, id_grupo_cuenta, estado_registro, id_usuario_creador)
       VALUES ($1, $2, $3, 'Activo', $4)
       ON CONFLICT (codigo) DO UPDATE
         SET nombre_cuenta = EXCLUDED.nombre_cuenta
       RETURNING id_cuenta`,
      [codigoCuenta, nombreCuenta.slice(0, 180), idGrupo, authUserId || null],
    ) as Array<{ id_cuenta: unknown }>;

    return Number(rows[0].id_cuenta);
  }

  private async ensureCuentaAsignacion(
    manager: EntityManager,
    entidadTipo: string,
    idCuenta: number,
    ids: { id_persona_estudiante?: number; id_persona_tutor?: number },
    authUserId?: string,
  ): Promise<void> {
    const rows = await manager.query(
      `SELECT id_cuenta_asignacion
         FROM contabilidad.cuenta_asignacion
        WHERE entidad_tipo = $1
          AND id_cuenta = $2
          AND COALESCE(id_persona_estudiante, -1) = COALESCE($3::bigint, -1)
          AND COALESCE(id_persona_tutor, -1) = COALESCE($4::bigint, -1)
          AND COALESCE(estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
        LIMIT 1`,
      [entidadTipo, idCuenta, ids.id_persona_estudiante || null, ids.id_persona_tutor || null],
    ) as Array<{ id_cuenta_asignacion: unknown }>;

    if (rows[0]) return;

    await manager.query(
      `INSERT INTO contabilidad.cuenta_asignacion
        (entidad_tipo, id_persona_estudiante, id_persona_tutor, id_cuenta, prioridad, vigente_desde, estado_registro, id_usuario_creador)
       VALUES ($1, $2, $3, $4, 1, CURRENT_DATE, 'Activo', $5)`,
      [entidadTipo, ids.id_persona_estudiante || null, ids.id_persona_tutor || null, idCuenta, authUserId || null],
    );
  }

  private toOptionalPositiveInt(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
  }


  private assertWriteAllowedForSmoke(method: 'POST' | 'UPDATE', resource: ResourceConfig): void {
    const isSmokeDryRun = this.config.get<string>('SMOKE_DRY_RUN_CRUD_WRITES', 'false') === 'true';
    const isTestEnvironment = this.config.get<string>('NODE_ENV', process.env.NODE_ENV || '') === 'test';

    if (isTestEnvironment && isSmokeDryRun) {
      throw new BadRequestException(
        `Smoke dry-run: endpoint ${method} de ${resource.routeModule}/${resource.routePath} alcanzado correctamente; escritura omitida para no contaminar la base de datos.`,
      );
    }
  }

  private mapIds(resource: ResourceConfig, ids: string[]): Record<string, string> {
    if (ids.length !== resource.primaryKeys.length) {
      throw new BadRequestException(`El recurso ${resource.entity} requiere ${resource.primaryKeys.length} identificador(es).`);
    }

    return resource.primaryKeys.reduce<Record<string, string>>((acc, primaryKey, index) => {
      acc[primaryKey] = ids[index];
      return acc;
    }, {});
  }
}
