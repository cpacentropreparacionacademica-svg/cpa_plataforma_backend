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

  async update(moduleName: string, resourcePath: string, ids: string[], payload: Record<string, unknown>, authUserId?: string) {
    const resource = this.findResource(moduleName, resourcePath);
    const idValues = this.mapIds(resource, ids);
    this.assertWriteAllowedForSmoke('UPDATE', resource);
    const data = await this.repository.update(resource, idValues, payload, authUserId);
    return { success: true, message: `${resource.entity} actualizado correctamente.`, data };
  }

  async get(moduleName: string, resourcePath: string, ids: string[]) {
    const resource = this.findResource(moduleName, resourcePath);
    const idValues = this.mapIds(resource, ids);
    const data = await this.repository.get(resource, idValues);
    return { success: true, message: `${resource.entity} obtenido correctamente.`, data };
  }

  async list(moduleName: string, resourcePath: string, query: Record<string, unknown>) {
    const resource = this.findResource(moduleName, resourcePath);
    const data = await this.repository.list(resource, query);
    return {
      success: true,
      message: `${resource.entity} listado correctamente.`,
      data,
      pagination: { count: data.count, limit: data.limit, offset: data.offset },
    };
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
