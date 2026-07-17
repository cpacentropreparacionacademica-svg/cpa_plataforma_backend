import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { PasswordHasherService } from '../../common/security/password-hasher.service';
import { generateNumericToken, sha256 } from '../../common/utils/crypto.util';

export interface DbUser {
  id_persona: string;
  nombre_usuario: string;
  contrasena_hash: string;
  tipo_usuario?: string | null;
  es_super_usuario: boolean;
  email?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
}

export interface DbRole {
  id_rol: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export interface DbPermission {
  id_permiso: string;
  codigo: string;
  descripcion?: string | null;
  modulo?: string | null;
  fuente: 'SUPER_USUARIO' | 'ROL' | 'DIRECTO';
}

@Injectable()
export class AuthRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly passwords: PasswordHasherService,
    private readonly config: ConfigService,
  ) {}

  async getUserByEmail(email: string): Promise<DbUser | null> {
    return this.findUser('LOWER(p.email) = LOWER($1)', email.trim());
  }

  async getUserByLoginIdentifier(identifier: string): Promise<DbUser | null> {
    return this.findUser("LOWER(COALESCE(p.email, '')) = LOWER($1) OR LOWER(u.nombre_usuario) = LOWER($1)", identifier.trim());
  }

  async getUserByIdPersona(personId: string): Promise<DbUser | null> {
    const rows = await this.dataSource.query(
      `SELECT u.id_persona, u.nombre_usuario, u.contrasena_hash, u.tipo_usuario, u.es_super_usuario,
              p.email, p.nombres, p.apellidos, p.telefono
       FROM persona.persona_usuario u
       LEFT JOIN persona.persona p ON p.id_persona = u.id_persona
       WHERE u.id_persona = $1
       LIMIT 1`,
      [personId],
    ) as DbUser[];
    return rows[0] || null;
  }

  async getRolesByIdPersona(personId: string): Promise<DbRole[]> {
    return this.dataSource.query(
      `SELECT DISTINCT r.id_rol, r.codigo, r.nombre, r.descripcion
       FROM seguridad.usuario_rol ur
       INNER JOIN seguridad.rol r ON r.id_rol = ur.id_rol
       WHERE ur.id_persona = $1
         AND LOWER(COALESCE(ur.estado_registro, 'activo')) = 'activo'
         AND LOWER(COALESCE(r.estado_registro, 'activo')) = 'activo'
       ORDER BY r.codigo ASC`,
      [personId],
    ) as Promise<DbRole[]>;
  }

  async getEffectivePermissionsByIdPersona(personId: string): Promise<DbPermission[]> {
    const user = await this.getUserByIdPersona(personId);
    if (!user) return [];
    if (user.es_super_usuario) {
      return this.dataSource.query(
        `SELECT p.id_permiso, p.codigo, p.descripcion, p.modulo, 'SUPER_USUARIO'::text AS fuente
         FROM seguridad.permiso p
         WHERE LOWER(COALESCE(p.estado_registro, 'activo')) = 'activo'
         ORDER BY COALESCE(p.modulo, ''), p.codigo ASC`,
      ) as Promise<DbPermission[]>;
    }

    return this.dataSource.query(
      `WITH direct_denied AS (
          SELECT up.id_permiso FROM seguridad.usuario_permiso up
          INNER JOIN seguridad.permiso p ON p.id_permiso = up.id_permiso
          WHERE up.id_persona = $1 AND up.permitido = false
            AND LOWER(COALESCE(p.estado_registro, 'activo')) = 'activo'
        ), direct_allowed AS (
          SELECT p.id_permiso, p.codigo, p.descripcion, p.modulo, 'DIRECTO'::text AS fuente
          FROM seguridad.usuario_permiso up
          INNER JOIN seguridad.permiso p ON p.id_permiso = up.id_permiso
          WHERE up.id_persona = $1 AND up.permitido = true
            AND LOWER(COALESCE(p.estado_registro, 'activo')) = 'activo'
        ), role_allowed AS (
          SELECT p.id_permiso, p.codigo, p.descripcion, p.modulo, 'ROL'::text AS fuente
          FROM seguridad.usuario_rol ur
          INNER JOIN seguridad.rol r ON r.id_rol = ur.id_rol
          INNER JOIN seguridad.rol_permiso rp ON rp.id_rol = r.id_rol
          INNER JOIN seguridad.permiso p ON p.id_permiso = rp.id_permiso
          WHERE ur.id_persona = $1
            AND LOWER(COALESCE(ur.estado_registro, 'activo')) = 'activo'
            AND LOWER(COALESCE(r.estado_registro, 'activo')) = 'activo'
            AND LOWER(COALESCE(p.estado_registro, 'activo')) = 'activo'
        ), effective AS (
          SELECT * FROM direct_allowed UNION ALL SELECT * FROM role_allowed
        ), ranked AS (
          SELECT DISTINCT ON (e.id_permiso) e.id_permiso, e.codigo, e.descripcion, e.modulo, e.fuente
          FROM effective e
          WHERE NOT EXISTS (SELECT 1 FROM direct_denied d WHERE d.id_permiso = e.id_permiso)
          ORDER BY e.id_permiso, CASE WHEN e.fuente = 'DIRECTO' THEN 0 ELSE 1 END
        )
        SELECT id_permiso, codigo, descripcion, modulo, fuente
        FROM ranked ORDER BY COALESCE(modulo, ''), codigo ASC`,
      [personId],
    ) as Promise<DbPermission[]>;
  }

  async createUser(payload: { id_persona: string; nombre_usuario: string; password: string; tipo_usuario?: string }): Promise<DbUser | null> {
    const passwordHash = await this.passwords.hash(payload.password);
    await this.dataSource.query(
      `INSERT INTO persona.persona_usuario (id_persona, nombre_usuario, contrasena_hash, tipo_usuario, estado_registro)
       VALUES ($1, $2, $3, $4, 'Activo')`,
      [payload.id_persona, payload.nombre_usuario, passwordHash, payload.tipo_usuario || null],
    );
    return this.getUserByIdPersona(payload.id_persona);
  }

  async updatePassword(personId: string, newPassword: string): Promise<void> {
    const passwordHash = await this.passwords.hash(newPassword);
    await this.dataSource.query(
      `UPDATE persona.persona_usuario SET contrasena_hash = $2, fecha_modificacion = NOW() WHERE id_persona = $1`,
      [personId, passwordHash],
    );
  }

  async upgradePasswordHash(personId: string, plainPassword: string, expectedLegacyHash: string): Promise<void> {
    const passwordHash = await this.passwords.hash(plainPassword);
    await this.dataSource.query(
      `UPDATE persona.persona_usuario
       SET contrasena_hash = $2, fecha_modificacion = NOW()
       WHERE id_persona = $1 AND contrasena_hash = $3`,
      [personId, passwordHash, expectedLegacyHash],
    );
  }

  async activateUser(personId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE persona.persona_usuario SET estado_registro = 'Activo', fecha_modificacion = NOW() WHERE id_persona = $1`,
      [personId],
    );
  }

  async consumeActionToken(personId: string, action: string, plainToken: string): Promise<boolean> {
    const rows = await this.dataSource.query(
      `UPDATE seguridad.usuario_token_accion token
       SET fecha_usado = NOW(), estado_registro = 'Usado'
       WHERE token.ctid = (
         SELECT candidate.ctid
         FROM seguridad.usuario_token_accion candidate
         WHERE candidate.id_persona = $1
           AND candidate.accion = $2
           AND candidate.token_hash = $3
           AND candidate.fecha_usado IS NULL
           AND candidate.fecha_revocado IS NULL
           AND candidate.fecha_expiracion > NOW()
           AND candidate.estado_registro = 'Activo'
         ORDER BY candidate.fecha_expiracion DESC
         LIMIT 1
         FOR UPDATE
       )
       RETURNING token.token_hash`,
      [personId, action, sha256(plainToken)],
    ) as Array<{ token_hash: string }>;
    return rows.length === 1;
  }

  async generateActionToken(personId: string, action: string): Promise<{ token: string; fecha_expiracion: string }> {
    const token = generateNumericToken(6);
    const ttlMinutes = Number(this.config.get<string>('ACTION_TOKEN_TTL_MINUTES', '15'));
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE seguridad.usuario_token_accion
         SET fecha_revocado = NOW(), estado_registro = 'Revocado'
         WHERE id_persona = $1 AND accion = $2 AND fecha_usado IS NULL AND fecha_revocado IS NULL`,
        [personId, action],
      );
      await manager.query(
        `INSERT INTO seguridad.usuario_token_accion
          (id_persona, accion, token_hash, fecha_expiracion, estado_registro, id_usuario_creador)
         VALUES ($1, $2, $3, $4, 'Activo', $1)`,
        [personId, action, sha256(token), expiresAt],
      );
    });

    return { token, fecha_expiracion: expiresAt.toISOString() };
  }

  private async findUser(whereSql: string, identifier: string): Promise<DbUser | null> {
    const rows = await this.dataSource.query(
      `SELECT u.id_persona, u.nombre_usuario, u.contrasena_hash, u.tipo_usuario, u.es_super_usuario,
              p.email, p.nombres, p.apellidos, p.telefono
       FROM persona.persona_usuario u
       INNER JOIN persona.persona p ON p.id_persona = u.id_persona
       WHERE ${whereSql}
       LIMIT 1`,
      [identifier],
    ) as DbUser[];
    return rows[0] || null;
  }
}
