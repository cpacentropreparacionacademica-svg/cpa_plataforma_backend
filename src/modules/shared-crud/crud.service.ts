import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import * as XLSX from 'xlsx';
import { CrudRepository } from '../../common/repositories/crud.repository';
import { PermissionService } from '../../common/services/permission.service';
import { getResourceConfig, ResourceConfig } from '../resource-registry';

@Injectable()
export class CrudService {
  constructor(
    private readonly repository: CrudRepository,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly permissions: PermissionService,
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
    this.assertNoFragmentedCreate(resource);
    this.assertWriteAllowedForSmoke('POST', resource);
    await this.assertSecurityWriteAllowed(resource, payload, authUserId);
    const data = await this.repository.create(resource, payload, authUserId);
    await this.provisionAccountingAccountsAfterCreate(resource, data, authUserId);
    return { success: true, message: `${resource.entity} creado correctamente.`, data };
  }

  async createBatch(moduleName: string, resourcePath: string, payload: unknown, authUserId?: string) {
    const resource = this.findResource(moduleName, resourcePath);
    this.assertNoFragmentedCreate(resource);
    this.assertWriteAllowedForSmoke('POST', resource);
    const items = this.normalizeCreateBatchPayload(payload);
    for (const item of items) {
      await this.assertSecurityWriteAllowed(resource, item, authUserId);
    }
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

  async update(
    moduleName: string,
    resourcePath: string,
    ids: string[],
    payload: Record<string, unknown>,
    authUserId?: string,
  ) {
    const resource = this.findResource(moduleName, resourcePath);
    const idValues = this.mapIds(resource, ids);
    this.assertNoLedgerUpdate(resource);
    this.assertWriteAllowedForSmoke('UPDATE', resource);
    await this.assertSecurityWriteAllowed(resource, payload, authUserId, idValues);
    const data = await this.repository.update(resource, idValues, payload, authUserId);
    return { success: true, message: `${resource.entity} actualizado correctamente.`, data };
  }

  async updateBatch(moduleName: string, resourcePath: string, payload: unknown, authUserId?: string) {
    const resource = this.findResource(moduleName, resourcePath);
    this.assertNoLedgerUpdate(resource);
    this.assertWriteAllowedForSmoke('UPDATE', resource);
    const items = this.normalizeUpdateBatchPayload(resource, payload);
    for (const item of items) {
      await this.assertSecurityWriteAllowed(resource, item.data, authUserId, item.ids);
    }
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

  async validateImportBatch(
    moduleName: string,
    resourcePath: string,
    payload: {
      body?: Record<string, unknown>;
      files?: Array<{ buffer: Buffer; originalname?: string; mimetype?: string; size?: number }>;
    },
  ) {
    const resource = this.findResource(moduleName, resourcePath);
    const rows = this.extractImportRows(payload);
    const validation = await this.validateRowsForResource(
      resource,
      rows,
      String(payload.body?.mode || payload.body?.modo || payload.body?.operation || 'create'),
    );
    return {
      success: true,
      message: `Validación de importación para ${resource.entity} completada.`,
      data: validation,
      ...validation,
    };
  }

  async processImportBatch(
    moduleName: string,
    resourcePath: string,
    payload: {
      body?: Record<string, unknown>;
      files?: Array<{ buffer: Buffer; originalname?: string; mimetype?: string; size?: number }>;
    },
    authUserId?: string,
  ) {
    const resource = this.findResource(moduleName, resourcePath);
    const rows = this.extractImportRows(payload);
    const mode = this.normalizeImportMode(
      String(payload.body?.mode || payload.body?.modo || payload.body?.operation || 'create'),
    );
    const validation = await this.validateRowsForResource(resource, rows, mode);

    if (validation.errorRows > 0) {
      throw new BadRequestException(
        `La importación contiene ${validation.errorRows} fila(s) con error. Corrige el archivo antes de procesar.`,
      );
    }

    if (mode === 'update') {
      const data = await this.updateBatch(moduleName, resourcePath, { items: rows }, authUserId);
      return {
        ...data,
        message: `Importación de actualización procesada para ${resource.entity}.`,
        validation,
      };
    }

    if (mode === 'upsert') {
      const createRows: Record<string, unknown>[] = [];
      const updateRows: Record<string, unknown>[] = [];
      for (const row of rows) {
        const hasAllPrimaryKeys = resource.primaryKeys.every(
          (primaryKey) => row[primaryKey] !== undefined && row[primaryKey] !== null && row[primaryKey] !== '',
        );
        if (hasAllPrimaryKeys) updateRows.push(row);
        else createRows.push(row);
      }
      const created = createRows.length
        ? ((await this.createBatch(moduleName, resourcePath, { items: createRows }, authUserId)).data as Record<
            string,
            unknown
          >[])
        : [];
      const updated = updateRows.length
        ? ((await this.updateBatch(moduleName, resourcePath, { items: updateRows }, authUserId)).data as Record<
            string,
            unknown
          >[])
        : [];
      return {
        success: true,
        message: `Importación crear/actualizar procesada para ${resource.entity}.`,
        data: { created, updated },
        count: created.length + updated.length,
        validation,
      };
    }

    const data = await this.createBatch(moduleName, resourcePath, { items: rows }, authUserId);
    return {
      ...data,
      message: `Importación de creación procesada para ${resource.entity}.`,
      validation,
    };
  }

  /**
   * El libro diario no se edita: se corrige con un asiento de reversión.
   *
   * Los triggers de la migración 014 ya impiden alterar el contenido económico de un
   * movimiento, pero dejan mutable `estado_registro`. Como el trigger de balanceo solo
   * suma los movimientos activos, desactivar un subconjunto balanceado (por ejemplo 2 de
   * 4 líneas) anulaba parte del asiento sin dejar reversión ni rastro contable.
   */
  private assertNoLedgerUpdate(resource: ResourceConfig): void {
    const ledgerTables = ['transaccion', 'transaccion_movimiento_cuenta'];
    if (resource.schema !== 'contabilidad' || !ledgerTables.includes(resource.tableName)) return;

    throw new BadRequestException(
      `Los asientos contabilizados no se editan. Para corregir ${resource.entity} usa ` +
        'POST /api/contabilidad/transaccion/:id/revert y registra el asiento correcto.',
    );
  }

  private assertNoFragmentedCreate(resource: ResourceConfig): void {
    const key = `${resource.routeModule}/${resource.routePath}`;
    const lifecycleEndpoints: Record<string, string> = {
      'personas/persona':
        '/api/personas/estudiante/registrar, /api/personas/tutor/registrar, /api/personas/usuario/registrar o /api/administracion/empleado/registrar',
      'personas/estudiante': '/api/personas/estudiante/registrar',
      'personas/tutor': '/api/personas/tutor/registrar',
      'personas/usuario': '/api/personas/usuario/registrar',
      'administracion/empleado': '/api/administracion/empleado/registrar',
      'contabilidad/venta-clase-registro': '/api/contabilidad/venta-clase/registrar-batch',
      'contabilidad/transaccion-venta':
        '/api/contabilidad/venta-clase/registrar-batch o un endpoint transaccional de venta específico',
      'contabilidad/transaccion-detalle-venta':
        '/api/contabilidad/venta-clase/registrar-batch o un endpoint transaccional de venta específico',
      // El asiento contable solo puede nacer completo. Creando cabecera y movimientos por
      // separado se podía escribir en el libro mayor sin pasar por las reglas de partida
      // doble del servicio contable: bastaba un lote de movimientos que netease a cero.
      'contabilidad/transaccion': '/api/contabilidad/transaccion/con-movimientos',
      'contabilidad/transaccion-movimiento-cuenta': '/api/contabilidad/transaccion/con-movimientos',
    };

    const endpoint = lifecycleEndpoints[key];
    if (!endpoint) return;

    throw new BadRequestException(
      `Creación fragmentada no permitida para ${key}. Usa el endpoint transaccional ${endpoint}. ` +
        'La lectura y actualización del recurso siguen disponibles para edición controlada.',
    );
  }

  private extractImportRows(payload: {
    body?: Record<string, unknown>;
    files?: Array<{ buffer: Buffer; originalname?: string; mimetype?: string; size?: number }>;
  }): Record<string, unknown>[] {
    const body = payload.body || {};
    const file = payload.files?.[0];

    if (file?.buffer?.length) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: false });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new BadRequestException('El archivo no contiene hojas para importar.');
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
      return this.cleanImportRows(rows);
    }

    const candidate = body.items ?? body.rows ?? body.data ?? body.registros;
    if (typeof candidate === 'string') {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        if (Array.isArray(parsed)) return this.cleanImportRows(parsed as Record<string, unknown>[]);
        if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown[] }).items)) {
          return this.cleanImportRows((parsed as { items: Record<string, unknown>[] }).items);
        }
      } catch {
        throw new BadRequestException('El campo items/rows/data no contiene JSON válido.');
      }
    }

    if (Array.isArray(candidate)) return this.cleanImportRows(candidate as Record<string, unknown>[]);
    if (Array.isArray(body)) return this.cleanImportRows(body as Record<string, unknown>[]);
    throw new BadRequestException('La importación debe enviarse como archivo Excel/CSV o como JSON { items: [...] }.');
  }

  private cleanImportRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    const cleanRows = rows
      .filter((row) => row && typeof row === 'object' && !Array.isArray(row))
      .map((row) => {
        const clean: Record<string, unknown> = {};
        for (const [rawKey, rawValue] of Object.entries(row)) {
          const key = String(rawKey).trim();
          if (!key || key.startsWith('__EMPTY')) continue;
          const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
          clean[key] = value === '' ? null : value;
        }
        return clean;
      })
      .filter((row) => Object.values(row).some((value) => value !== null && value !== undefined && value !== ''));

    if (cleanRows.length === 0) throw new BadRequestException('La importación no contiene filas con datos.');
    if (cleanRows.length > 200)
      throw new BadRequestException('La importación genérica no puede superar 200 filas por solicitud.');
    return cleanRows;
  }

  private normalizeImportMode(mode: string): 'create' | 'update' | 'upsert' {
    const normalized = mode.trim().toLowerCase();
    if (['update', 'actualizar', 'patch', 'put'].includes(normalized)) return 'update';
    if (['upsert', 'crear_actualizar', 'crear-actualizar', 'create_update', 'crear/actualizar'].includes(normalized))
      return 'upsert';
    return 'create';
  }

  private async validateRowsForResource(resource: ResourceConfig, rows: Record<string, unknown>[], rawMode: string) {
    const mode = this.normalizeImportMode(rawMode);
    const columns = (await this.dataSource.query(
      `SELECT column_name AS "columnName", is_nullable AS "isNullable", column_default AS "columnDefault"
         FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2`,
      [resource.schema, resource.tableName],
    )) as Array<{ columnName: string; isNullable: string; columnDefault: string | null }>;
    const columnNames = new Set(columns.map((column) => column.columnName));
    const requiredColumns = columns
      .filter(
        (column) =>
          column.isNullable === 'NO' &&
          !column.columnDefault &&
          !resource.primaryKeys.includes(column.columnName) &&
          !['fecha_registro', 'version_registro', 'estado_registro'].includes(column.columnName),
      )
      .map((column) => column.columnName);

    const errors: Array<{ row: number; field?: string; message: string }> = [];
    const warnings: Array<{ row?: number; field?: string; message: string }> = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      const validKeys = Object.keys(row).filter((key) => columnNames.has(key));
      if (validKeys.length === 0) {
        errors.push({ row: rowNumber, message: 'La fila no contiene columnas válidas para este recurso.' });
      }

      for (const key of Object.keys(row)) {
        if (!columnNames.has(key))
          warnings.push({ row: rowNumber, field: key, message: 'Columna ignorada: no existe en la tabla destino.' });
      }

      if (mode === 'update') {
        for (const primaryKey of resource.primaryKeys) {
          if (row[primaryKey] === undefined || row[primaryKey] === null || row[primaryKey] === '') {
            errors.push({ row: rowNumber, field: primaryKey, message: 'Campo llave requerido para actualizar.' });
          }
        }
      }

      if (mode === 'create') {
        for (const requiredColumn of requiredColumns) {
          const hasDefaultCreateValue =
            resource.defaultCreateValues && resource.defaultCreateValues[requiredColumn] !== undefined;
          if (
            !hasDefaultCreateValue &&
            (row[requiredColumn] === undefined || row[requiredColumn] === null || row[requiredColumn] === '')
          ) {
            errors.push({ row: rowNumber, field: requiredColumn, message: 'Campo obligatorio para crear.' });
          }
        }
      }
    });

    const rowsWithErrors = new Set(errors.map((error) => error.row));
    return {
      resource: `${resource.routeModule}/${resource.routePath}`,
      schema: resource.schema,
      tableName: resource.tableName,
      mode,
      totalRows: rows.length,
      validRows: rows.length - rowsWithErrors.size,
      errorRows: rowsWithErrors.size,
      columns: Array.from(columnNames).sort(),
      primaryKeys: resource.primaryKeys,
      requiredColumns,
      sampleRows: rows.slice(0, 5),
      errors,
      warnings,
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

  private normalizeUpdateBatchPayload(
    resource: ResourceConfig,
    payload: unknown,
  ): Array<{ ids: Record<string, unknown>; data: Record<string, unknown> }> {
    const candidate = Array.isArray(payload) ? payload : (payload as { items?: unknown })?.items;

    if (!Array.isArray(candidate) || candidate.length === 0) {
      throw new BadRequestException('El batch de actualización debe enviarse como arreglo o como { items: [...] }.');
    }

    return candidate.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new BadRequestException(`El item ${index + 1} del batch debe ser un objeto JSON.`);
      }

      const source = item as Record<string, unknown>;
      const idsSource =
        source.ids && typeof source.ids === 'object' && !Array.isArray(source.ids)
          ? (source.ids as Record<string, unknown>)
          : source;
      const dataSource =
        source.data && typeof source.data === 'object' && !Array.isArray(source.data)
          ? (source.data as Record<string, unknown>)
          : source;

      const ids = resource.primaryKeys.reduce<Record<string, unknown>>((acc, primaryKey) => {
        acc[primaryKey] = idsSource[primaryKey];
        return acc;
      }, {});

      return { ids, data: dataSource };
    });
  }

  private async assertSecurityWriteAllowed(
    resource: ResourceConfig,
    payload: Record<string, unknown>,
    authUserId?: string,
    ids: Record<string, unknown> = {},
  ): Promise<void> {
    if (!authUserId) return;

    if (this.isSecurityAdministrationResource(resource)) {
      await this.assertCanManageSecurity(authUserId);
    }

    if (resource.schema === 'seguridad' && resource.tableName === 'usuario_permiso') {
      const targetUserId = this.toOptionalString(ids.id_persona ?? payload.id_persona);
      if (targetUserId === String(authUserId) && this.isFalseish(payload.permitido)) {
        throw new ForbiddenException(
          'No puedes negarte permisos a ti mismo desde usuario_permiso. Usa otro administrador para cambios críticos.',
        );
      }
    }

    if (resource.schema === 'seguridad' && resource.tableName === 'usuario_rol') {
      const targetUserId = this.toOptionalString(ids.id_persona ?? payload.id_persona);
      if (targetUserId === String(authUserId) && this.isInactiveStatus(payload.estado_registro)) {
        throw new ForbiddenException(
          'No puedes desactivar tu propio rol. Usa otro administrador para cambios críticos.',
        );
      }
    }

    if (resource.schema === 'persona' && resource.tableName === 'persona_usuario') {
      const targetUserId = this.toOptionalString(ids.id_persona ?? payload.id_persona);
      if (targetUserId === String(authUserId)) {
        if (payload.es_super_usuario === false || String(payload.es_super_usuario).toLowerCase() === 'false') {
          throw new ForbiddenException('No puedes quitarte a ti mismo el atributo de super usuario.');
        }
        if (this.isInactiveStatus(payload.estado_registro)) {
          throw new ForbiddenException('No puedes desactivar tu propio usuario.');
        }
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'es_super_usuario')) {
        await this.assertCanManageSecurity(authUserId);
      }
    }
  }

  private isSecurityAdministrationResource(resource: ResourceConfig): boolean {
    if (resource.schema !== 'seguridad') return false;
    return ['permiso', 'rol', 'rol_permiso', 'usuario_permiso', 'usuario_rol'].includes(resource.tableName);
  }

  private async assertCanManageSecurity(authUserId: string): Promise<void> {
    const canManagePermissions = await this.permissions.hasPermission(String(authUserId), 'SISTEMA.PERMISOS.GESTIONAR');
    const canManageRoles = await this.permissions.hasPermission(String(authUserId), 'SISTEMA.ROLES.GESTIONAR');
    const canAssignRoles = await this.permissions.hasPermission(String(authUserId), 'SISTEMA.USUARIOS.ASIGNAR_ROL');

    if (!canManagePermissions && !canManageRoles && !canAssignRoles) {
      throw new ForbiddenException(
        'Solo un usuario administrador puede modificar roles, permisos o asignaciones de seguridad.',
      );
    }
  }

  private isInactiveStatus(value: unknown): boolean {
    const normalized = this.toOptionalString(value)?.toLowerCase();
    return ['inactivo', 'inactive', 'desactivado', 'disabled', 'false', '0'].includes(normalized || '');
  }

  private isFalseish(value: unknown): boolean {
    if (value === false) return true;
    const normalized = this.toOptionalString(value)?.toLowerCase();
    return ['false', '0', 'no', 'n', 'inactivo', 'desactivado', 'disabled'].includes(normalized || '');
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
      const estudianteRows = (await manager.query(
        `SELECT pe.id_persona,
                COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.nombres, p.apellidos)), ''), 'Estudiante ' || pe.id_persona::text) AS nombre_completo
           FROM persona.persona_estudiante pe
           LEFT JOIN persona.persona p ON p.id_persona = pe.id_persona
          WHERE pe.id_persona = $1
          LIMIT 1`,
        [idEstudiante],
      )) as Array<{ id_persona: unknown; nombre_completo: unknown }>;

      if (!estudianteRows[0]) return;
      const nombre = String(estudianteRows[0].nombre_completo || `Estudiante ${idEstudiante}`).slice(0, 120);

      const idCuentaCxc = await this.ensureCuentaByGroupCode(
        manager,
        '1.1.02.01',
        `1.1.02.01.E${idEstudiante}`,
        `CxC estudiante ${idEstudiante} - ${nombre}`,
        authUserId,
      );
      await this.ensureCuentaAsignacion(
        manager,
        'ESTUDIANTE_CXC',
        idCuentaCxc,
        { id_persona_estudiante: idEstudiante },
        authUserId,
      );

      const idCuentaPaquete = await this.ensureCuentaByGroupCode(
        manager,
        '2.1.06',
        `2.1.06.E${idEstudiante}`,
        `Paquetes cobrados por anticipado estudiante ${idEstudiante} - ${nombre}`,
        authUserId,
      );
      await this.ensureCuentaAsignacion(
        manager,
        'ESTUDIANTE_PAQUETE_DIFERIDO',
        idCuentaPaquete,
        { id_persona_estudiante: idEstudiante },
        authUserId,
      );
    });
  }

  private async ensureTutorAccountingAccounts(idTutor: number, authUserId?: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const tutorRows = (await manager.query(
        `SELECT pt.id_tutor,
                COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.nombres, p.apellidos)), ''), 'Tutor ' || pt.id_tutor::text) AS nombre_completo
           FROM persona.persona_tutor pt
           LEFT JOIN persona.persona p ON p.id_persona = pt.id_persona
          WHERE pt.id_tutor = $1
          LIMIT 1`,
        [idTutor],
      )) as Array<{ id_tutor: unknown; nombre_completo: unknown }>;

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
    const existing = (await manager.query(`SELECT id_cuenta FROM contabilidad.cuenta WHERE codigo = $1 LIMIT 1`, [
      codigoCuenta,
    ])) as Array<{
      id_cuenta: unknown;
    }>;
    const existingId = this.toOptionalPositiveInt(existing[0]?.id_cuenta);
    if (existingId) return existingId;

    const groupRows = (await manager.query(
      `SELECT id_grupo_cuenta FROM contabilidad.grupo_cuenta WHERE codigo = $1 LIMIT 1`,
      [codigoGrupo],
    )) as Array<{
      id_grupo_cuenta: unknown;
    }>;
    const idGrupo = this.toOptionalPositiveInt(groupRows[0]?.id_grupo_cuenta);
    if (!idGrupo) {
      throw new BadRequestException(
        `No existe el grupo contable ${codigoGrupo}; no se pudo crear la cuenta ${codigoCuenta}.`,
      );
    }

    const rows = (await manager.query(
      `INSERT INTO contabilidad.cuenta
        (codigo, nombre_cuenta, id_grupo_cuenta, estado_registro, id_usuario_creador)
       VALUES ($1, $2, $3, 'Activo', $4)
       ON CONFLICT (codigo) DO UPDATE
         SET nombre_cuenta = EXCLUDED.nombre_cuenta
       RETURNING id_cuenta`,
      [codigoCuenta, nombreCuenta.slice(0, 180), idGrupo, authUserId || null],
    )) as Array<{ id_cuenta: unknown }>;

    return Number(rows[0].id_cuenta);
  }

  private async ensureCuentaAsignacion(
    manager: EntityManager,
    entidadTipo: string,
    idCuenta: number,
    ids: { id_persona_estudiante?: number; id_persona_tutor?: number },
    authUserId?: string,
  ): Promise<void> {
    const rows = (await manager.query(
      `SELECT id_cuenta_asignacion
         FROM contabilidad.cuenta_asignacion
        WHERE entidad_tipo = $1
          AND id_cuenta = $2
          AND COALESCE(id_persona_estudiante, -1) = COALESCE($3::bigint, -1)
          AND COALESCE(id_persona_tutor, -1) = COALESCE($4::bigint, -1)
          AND COALESCE(estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
        LIMIT 1`,
      [entidadTipo, idCuenta, ids.id_persona_estudiante || null, ids.id_persona_tutor || null],
    )) as Array<{ id_cuenta_asignacion: unknown }>;

    if (rows[0]) return;

    try {
      await manager.query(
        `INSERT INTO contabilidad.cuenta_asignacion
          (entidad_tipo, id_persona_estudiante, id_persona_tutor, id_cuenta, prioridad, vigente_desde, estado_registro, id_usuario_creador)
         VALUES ($1, $2, $3, $4, 1, CURRENT_DATE, 'Activo', $5)`,
        [entidadTipo, ids.id_persona_estudiante || null, ids.id_persona_tutor || null, idCuenta, authUserId || null],
      );
    } catch (error) {
      // Entre la comprobación anterior y este INSERT, otra transacción pudo crear la misma
      // asignación. El índice único ux_cuenta_asignacion_entidad_cuenta lo detecta; que
      // exista ya es exactamente el resultado buscado.
      if ((error as { code?: string })?.code !== '23505') throw error;
    }
  }

  private toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
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
      throw new BadRequestException(
        `El recurso ${resource.entity} requiere ${resource.primaryKeys.length} identificador(es).`,
      );
    }

    return resource.primaryKeys.reduce<Record<string, string>>((acc, primaryKey, index) => {
      acc[primaryKey] = ids[index];
      return acc;
    }, {});
  }
}
