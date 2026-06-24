import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrudRepository } from '../../common/repositories/crud.repository';
import { getResourceConfig, ResourceConfig } from '../resource-registry';

@Injectable()
export class CrudService {
  constructor(private readonly repository: CrudRepository, private readonly config: ConfigService) {}

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
    return { success: true, message: `${resource.entity} creado correctamente.`, data };
  }

  async createBatch(moduleName: string, resourcePath: string, payload: unknown, authUserId?: string) {
    const resource = this.findResource(moduleName, resourcePath);
    this.assertWriteAllowedForSmoke('POST', resource);
    const items = this.normalizeCreateBatchPayload(payload);
    const data = await this.repository.createMany(resource, items, authUserId);
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
