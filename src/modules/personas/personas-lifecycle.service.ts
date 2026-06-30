import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { PermissionService } from '../../common/services/permission.service';
import { sha256 } from '../../common/utils/crypto.util';
import { toHttpDatabaseException } from '../../common/utils/database-error.util';

@Injectable()
export class PersonasLifecycleService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly permissions: PermissionService,
  ) {}

  async registrarEstudiante(payload: Record<string, unknown>, authUserId?: string) {
    await this.assertPermission(authUserId, 'PERSONAS.ESTUDIANTE.REGISTRAR');
    try {
      const data = await this.dataSource.transaction(async (manager) => {
        const persona = await this.insertPersona(manager, this.extractPersonaPayload(payload), authUserId);
        const estudiante = await this.insertEstudiante(manager, Number(persona.id_persona), this.extractChildPayload(payload, 'estudiante'), authUserId);
        await this.ensureStudentAccountingAccounts(manager, Number(persona.id_persona), authUserId);
        return { persona, estudiante };
      });
      return { success: true, message: 'Estudiante registrado correctamente con persona base y cuentas contables asociadas.', data };
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async registrarTutor(payload: Record<string, unknown>, authUserId?: string) {
    await this.assertPermission(authUserId, 'PERSONAS.TUTOR.REGISTRAR');
    try {
      const data = await this.dataSource.transaction(async (manager) => {
        const persona = await this.insertPersona(manager, this.extractPersonaPayload(payload), authUserId);
        const tutor = await this.insertTutor(manager, Number(persona.id_persona), this.extractChildPayload(payload, 'tutor'), authUserId);
        await this.ensureTutorAccountingAccounts(manager, Number(tutor.id_tutor), authUserId);
        return { persona, tutor };
      });
      return { success: true, message: 'Tutor registrado correctamente con persona base y cuenta por pagar asociada.', data };
    } catch (error) {
      const httpException = toHttpDatabaseException(error);
      if (httpException) throw httpException;
      throw error;
    }
  }

  async registrarUsuario(payload: Record<string, unknown>, authUserId?: string) {
    await this.assertPermission(authUserId, 'PERSONAS.USUARIO.REGISTRAR');
    try {
      const data = await this.dataSource.transaction(async (manager) => {
        const persona = await this.insertPersona(manager, this.extractPersonaPayload(payload), authUserId);
        const usuario = await this.insertUsuario(manager, Number(persona.id_persona), this.extractChildPayload(payload, 'usuario'), authUserId);
        await this.assignRolesIfProvided(manager, Number(persona.id_persona), payload, authUserId);
        return { persona, usuario };
      });
      return { success: true, message: 'Usuario registrado correctamente con persona base y credenciales del sistema.', data };
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

    const nombres = this.requiredString(source.nombres ?? source.nombre, 'persona.nombres');
    return {
      id_persona: this.optionalPositiveInt(source.id_persona),
      nombres,
      apellidos: this.optionalString(source.apellidos),
      telefono: this.optionalString(source.telefono),
      fecha_nacimiento: this.optionalString(source.fecha_nacimiento),
      email: this.optionalString(source.email),
    };
  }

  private extractChildPayload(payload: Record<string, unknown>, key: 'estudiante' | 'tutor' | 'usuario'): Record<string, unknown> {
    const nested = payload[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
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

  private async insertEstudiante(manager: EntityManager, idPersona: number, payload: Record<string, unknown>, authUserId?: string): Promise<Record<string, unknown>> {
    const tipo = this.requiredString(payload.tipo, 'estudiante.tipo').toUpperCase();
    const codigo = this.optionalString(payload.codigo_estudiante);
    const idUnidadEducativa = this.optionalPositiveInt(payload.id_unidad_educativa);
    const nivel = this.optionalString(payload.nivel_actual)?.toUpperCase();
    const curso = this.optionalString(payload.curso_actual)?.toUpperCase();
    const turno = this.optionalString(payload.turno_actual)?.toUpperCase();
    const carrera = this.optionalString(payload.carrera);
    const anioIngreso = this.optionalPositiveInt(payload.anio_ingreso);

    if (tipo === 'COLEGIAL' && (!nivel || !curso || !turno)) {
      throw new BadRequestException('estudiante COLEGIAL requiere nivel_actual, curso_actual y turno_actual.');
    }
    if (tipo === 'UNIVERSITARIO' && (!carrera || !anioIngreso)) {
      throw new BadRequestException('estudiante UNIVERSITARIO requiere carrera y anio_ingreso.');
    }

    const rows = await manager.query(
      `INSERT INTO persona.persona_estudiante
        (id_persona, codigo_estudiante, id_unidad_educativa, tipo, nivel_actual, curso_actual, turno_actual, carrera, anio_ingreso, id_usuario, estado_registro)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING *`,
      [
        idPersona,
        codigo || null,
        idUnidadEducativa || null,
        tipo,
        tipo === 'COLEGIAL' ? nivel : null,
        tipo === 'COLEGIAL' ? curso : null,
        tipo === 'COLEGIAL' ? turno : null,
        tipo === 'UNIVERSITARIO' ? carrera : null,
        tipo === 'UNIVERSITARIO' ? anioIngreso : null,
        authUserId || null,
      ],
    ) as Record<string, unknown>[];
    return rows[0];
  }

  private async insertTutor(manager: EntityManager, idPersona: number, payload: Record<string, unknown>, authUserId?: string): Promise<Record<string, unknown>> {
    const pagoPorHora = this.nonNegativeNumber(payload.pago_por_hora, 'tutor.pago_por_hora');
    const nivelExperiencia = this.requiredString(payload.nivel_experiencia, 'tutor.nivel_experiencia').toUpperCase();
    const tipoEspecialidad = this.requiredString(payload.tipo_estudiante_especialidad, 'tutor.tipo_estudiante_especialidad').toUpperCase();
    const nivelEspecialidad = this.optionalString(payload.nivel_estudiante_especialidad)?.toUpperCase();

    if (tipoEspecialidad === 'COLEGIAL' && !nivelEspecialidad) {
      throw new BadRequestException('tutor COLEGIAL requiere nivel_estudiante_especialidad.');
    }

    const rows = await manager.query(
      `INSERT INTO persona.persona_tutor
        (id_persona, pago_por_hora, nivel_experiencia, tipo_estudiante_especialidad, nivel_estudiante_especialidad, id_usuario, estado_registro)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [idPersona, pagoPorHora, nivelExperiencia, tipoEspecialidad, tipoEspecialidad === 'COLEGIAL' ? nivelEspecialidad : null, authUserId || null],
    ) as Record<string, unknown>[];
    return rows[0];
  }

  private async insertUsuario(manager: EntityManager, idPersona: number, payload: Record<string, unknown>, authUserId?: string): Promise<Record<string, unknown>> {
    const nombreUsuario = this.requiredString(payload.nombre_usuario ?? payload.usuario, 'usuario.nombre_usuario');
    const password = this.requiredString(payload.password ?? payload.contrasena ?? payload.contraseña, 'usuario.password');
    const tipoUsuario = this.optionalString(payload.tipo_usuario) || 'USUARIO_INTERNO';
    const esSuperUsuario = payload.es_super_usuario === true || String(payload.es_super_usuario).toLowerCase() === 'true';

    if (esSuperUsuario) await this.assertPermission(authUserId, 'SISTEMA.PERMISOS.GESTIONAR');

    const rows = await manager.query(
      `INSERT INTO persona.persona_usuario
        (id_persona, nombre_usuario, contrasena_hash, tipo_usuario, estado_registro, es_super_usuario, id_usuario_creador)
       VALUES ($1, $2, $3, $4, 'Activo', $5, $6)
       RETURNING *`,
      [idPersona, nombreUsuario, sha256(password), tipoUsuario, esSuperUsuario, authUserId || null],
    ) as Record<string, unknown>[];
    return rows[0];
  }

  private async assignRolesIfProvided(manager: EntityManager, idPersona: number, payload: Record<string, unknown>, authUserId?: string): Promise<void> {
    const rawRoles = payload.roles ?? payload.codigos_roles ?? payload.roles_codigo;
    const roles = Array.isArray(rawRoles) ? rawRoles.map((role) => String(role).trim()).filter(Boolean) : [];
    if (roles.length === 0) return;

    await this.assertPermission(authUserId, 'SISTEMA.USUARIOS.ASIGNAR_ROL');

    await manager.query(
      `INSERT INTO seguridad.usuario_rol (id_persona, id_rol, estado_registro, id_usuario_creador)
       SELECT $1, r.id_rol, 'Activo', $3
       FROM seguridad.rol r
       WHERE r.codigo = ANY($2::text[])
         AND COALESCE(r.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
       ON CONFLICT (id_persona, id_rol) DO UPDATE SET
         estado_registro = 'Activo',
         fecha_modificacion = NOW(),
         version_registro = COALESCE(seguridad.usuario_rol.version_registro, 1) + 1,
         id_usuario_modificacion = EXCLUDED.id_usuario_creador`,
      [idPersona, roles, authUserId || null],
    );
  }

  private async ensureStudentAccountingAccounts(manager: EntityManager, idEstudiante: number, authUserId?: string): Promise<void> {
    const personaRows = await manager.query(
      `SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ', nombres, apellidos)), ''), 'Estudiante ' || id_persona::text) AS nombre_completo
         FROM persona.persona WHERE id_persona = $1 LIMIT 1`,
      [idEstudiante],
    ) as Array<{ nombre_completo: unknown }>;
    const nombre = String(personaRows[0]?.nombre_completo || `Estudiante ${idEstudiante}`).slice(0, 120);
    const idCuentaCxc = await this.ensureCuentaByGroupCode(manager, '1.1.02.01', `1.1.02.01.E${idEstudiante}`, `CxC estudiante ${idEstudiante} - ${nombre}`, authUserId);
    await this.ensureCuentaAsignacion(manager, 'ESTUDIANTE_CXC', idCuentaCxc, { id_persona_estudiante: idEstudiante }, authUserId);
    const idCuentaPaquete = await this.ensureCuentaByGroupCode(manager, '2.1.06', `2.1.06.E${idEstudiante}`, `Paquetes cobrados por anticipado estudiante ${idEstudiante} - ${nombre}`, authUserId);
    await this.ensureCuentaAsignacion(manager, 'ESTUDIANTE_PAQUETE_DIFERIDO', idCuentaPaquete, { id_persona_estudiante: idEstudiante }, authUserId);
  }

  private async ensureTutorAccountingAccounts(manager: EntityManager, idTutor: number, authUserId?: string): Promise<void> {
    const tutorRows = await manager.query(
      `SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.nombres, p.apellidos)), ''), 'Tutor ' || pt.id_tutor::text) AS nombre_completo
         FROM persona.persona_tutor pt
         LEFT JOIN persona.persona p ON p.id_persona = pt.id_persona
        WHERE pt.id_tutor = $1 LIMIT 1`,
      [idTutor],
    ) as Array<{ nombre_completo: unknown }>;
    const nombre = String(tutorRows[0]?.nombre_completo || `Tutor ${idTutor}`).slice(0, 120);
    const idCuentaTutor = await this.ensureCuentaByGroupCode(manager, '2.1.03', `2.1.03.T${idTutor}`, `CxP tutor ${idTutor} - ${nombre}`, authUserId);
    await this.ensureCuentaAsignacion(manager, 'TUTOR_CXP', idCuentaTutor, { id_persona_tutor: idTutor }, authUserId);
  }

  private async ensureCuentaByGroupCode(manager: EntityManager, codigoGrupo: string, codigoCuenta: string, nombreCuenta: string, authUserId?: string): Promise<number> {
    const existing = await manager.query(`SELECT id_cuenta FROM contabilidad.cuenta WHERE codigo = $1 LIMIT 1`, [codigoCuenta]) as Array<{ id_cuenta: unknown }>;
    const existingId = this.optionalPositiveInt(existing[0]?.id_cuenta);
    if (existingId) return existingId;

    const groupRows = await manager.query(`SELECT id_grupo_cuenta FROM contabilidad.grupo_cuenta WHERE codigo = $1 LIMIT 1`, [codigoGrupo]) as Array<{ id_grupo_cuenta: unknown }>;
    const idGrupo = this.optionalPositiveInt(groupRows[0]?.id_grupo_cuenta);
    if (!idGrupo) throw new BadRequestException(`No existe grupo contable ${codigoGrupo}.`);

    const rows = await manager.query(
      `INSERT INTO contabilidad.cuenta (codigo, nombre_cuenta, id_grupo_cuenta, estado_registro, id_usuario_creador)
       VALUES ($1, $2, $3, 'Activo', $4)
       ON CONFLICT (codigo) DO UPDATE SET nombre_cuenta = EXCLUDED.nombre_cuenta, id_grupo_cuenta = EXCLUDED.id_grupo_cuenta, estado_registro = 'Activo'
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
    await manager.query(
      `INSERT INTO contabilidad.cuenta_asignacion
        (entidad_tipo, id_persona_estudiante, id_persona_tutor, id_cuenta, prioridad, vigente_desde, estado_registro, id_usuario_creador)
       VALUES ($1, $2, $3, $4, 1, CURRENT_DATE, 'Activo', $5)
       ON CONFLICT DO NOTHING`,
      [entidadTipo, ids.id_persona_estudiante || null, ids.id_persona_tutor || null, idCuenta, authUserId || null],
    );
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

  private nonNegativeNumber(value: unknown, label: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new BadRequestException(`${label} debe ser un número mayor o igual a cero.`);
    return Math.round(parsed * 100) / 100;
  }
}
