import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { PermissionService } from '../../common/services/permission.service';
import { toHttpDatabaseException } from '../../common/utils/database-error.util';

@Injectable()
export class AdministracionLifecycleService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly permissions: PermissionService,
  ) {}

  async registrarEmpleado(payload: Record<string, unknown>, authUserId?: string) {
    await this.assertPermission(authUserId, 'ADMINISTRACION.EMPLEADO.REGISTRAR');
    try {
      const data = await this.dataSource.transaction(async (manager) => {
        const persona = await this.insertPersona(manager, this.extractPersonaPayload(payload), authUserId);
        const empleado = await this.insertEmpleado(manager, Number(persona.id_persona), this.extractEmpleadoPayload(payload), authUserId);
        return { persona, empleado };
      });
      return { success: true, message: 'Empleado registrado correctamente con persona base y ficha laboral.', data };
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  private async assertPermission(authUserId: string | undefined, permissionCode: string): Promise<void> {
    if (!authUserId) return;
    const allowed = await this.permissions.hasPermission(String(authUserId), permissionCode);
    if (!allowed) throw new ForbiddenException(`No tienes permiso para ejecutar ${permissionCode}.`);
  }

  private extractPersonaPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const nested = payload.persona;
    const source = nested && typeof nested === 'object' && !Array.isArray(nested)
      ? nested as Record<string, unknown>
      : payload;
    return {
      id_persona: this.optionalPositiveInt(source.id_persona),
      nombres: this.requiredString(source.nombres ?? source.nombre, 'persona.nombres'),
      apellidos: this.optionalString(source.apellidos),
      telefono: this.optionalString(source.telefono),
      fecha_nacimiento: this.optionalString(source.fecha_nacimiento),
      email: this.optionalString(source.email),
    };
  }

  private extractEmpleadoPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const nested = payload.empleado;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) return nested as Record<string, unknown>;
    return payload;
  }

  private async insertPersona(manager: EntityManager, persona: Record<string, unknown>, authUserId?: string): Promise<Record<string, unknown>> {
    const idPersona = this.optionalPositiveInt(persona.id_persona);
    const rows = await manager.query(
      `INSERT INTO persona.persona
        (${idPersona ? 'id_persona, ' : ''}nombres, apellidos, telefono, fecha_nacimiento, email, estado_registro, id_usuario_creador)
       VALUES (${idPersona ? '$1, ' : ''}$${idPersona ? 2 : 1}, $${idPersona ? 3 : 2}, $${idPersona ? 4 : 3}, $${idPersona ? 5 : 4}, $${idPersona ? 6 : 5}, 'Activo', $${idPersona ? 7 : 6})
       RETURNING *`,
      idPersona
        ? [idPersona, persona.nombres, persona.apellidos || null, persona.telefono || null, persona.fecha_nacimiento || null, persona.email || null, authUserId || null]
        : [persona.nombres, persona.apellidos || null, persona.telefono || null, persona.fecha_nacimiento || null, persona.email || null, authUserId || null],
    ) as Record<string, unknown>[];
    return rows[0];
  }

  private async insertEmpleado(manager: EntityManager, idPersona: number, payload: Record<string, unknown>, authUserId?: string): Promise<Record<string, unknown>> {
    const fechaIngreso = this.requiredString(payload.fecha_ingreso, 'empleado.fecha_ingreso');
    const tipoContrato = (this.optionalString(payload.tipo_contrato) || 'INDEFINIDO').toUpperCase();
    const jornada = (this.optionalString(payload.jornada) || 'FULL_TIME').toUpperCase();
    const idSucursal = this.optionalPositiveInt(payload.id_sucursal);

    const rows = await manager.query(
      `INSERT INTO administracion.empleado
        (id_persona, fecha_ingreso, fecha_salida, tipo_contrato, jornada, email_corporativo,
         telefono_corporativo, id_sucursal, estado_registro, id_usuario_creador)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Activo', $9)
       RETURNING *`,
      [
        idPersona,
        fechaIngreso,
        this.optionalString(payload.fecha_salida) || null,
        tipoContrato,
        jornada,
        this.optionalString(payload.email_corporativo) || null,
        this.optionalString(payload.telefono_corporativo) || null,
        idSucursal || null,
        authUserId || null,
      ],
    ) as Record<string, unknown>[];
    return rows[0];
  }

  private requiredString(value: unknown, label: string): string {
    const text = this.optionalString(value);
    if (!text) throw new BadRequestException(`${label} es obligatorio.`);
    return text;
  }

  private optionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
  }

  private optionalPositiveInt(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
  }
}
