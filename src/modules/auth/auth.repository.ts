import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { sha256 } from '../../common/utils/crypto.util';

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

@Injectable()
export class AuthRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const rows = await this.dataSource.query(
      `SELECT u.id_persona, u.nombre_usuario, u.contrasena_hash, u.tipo_usuario, u.es_super_usuario,
              p.email, p.nombres, p.apellidos, p.telefono
       FROM persona.persona_usuario u
       INNER JOIN persona.persona p ON p.id_persona = u.id_persona
       WHERE LOWER(p.email) = LOWER($1)
       LIMIT 1`,
      [email.trim()],
    ) as DbUser[];
    return rows[0] || null;
  }


  async getUserByLoginIdentifier(identifier: string): Promise<DbUser | null> {
    const normalized = identifier.trim();
    const rows = await this.dataSource.query(
      `SELECT u.id_persona, u.nombre_usuario, u.contrasena_hash, u.tipo_usuario, u.es_super_usuario,
              p.email, p.nombres, p.apellidos, p.telefono
       FROM persona.persona_usuario u
       INNER JOIN persona.persona p ON p.id_persona = u.id_persona
       WHERE LOWER(COALESCE(p.email, '')) = LOWER($1)
          OR LOWER(u.nombre_usuario) = LOWER($1)
       LIMIT 1`,
      [normalized],
    ) as DbUser[];
    return rows[0] || null;
  }
  async getUserByIdPersona(idPersona: string): Promise<DbUser | null> {
    const rows = await this.dataSource.query(
      `SELECT u.id_persona, u.nombre_usuario, u.contrasena_hash, u.tipo_usuario, u.es_super_usuario,
              p.email, p.nombres, p.apellidos, p.telefono
       FROM persona.persona_usuario u
       LEFT JOIN persona.persona p ON p.id_persona = u.id_persona
       WHERE u.id_persona = $1
       LIMIT 1`,
      [idPersona],
    ) as DbUser[];
    return rows[0] || null;
  }

  async createUser(payload: { id_persona: string; nombre_usuario: string; password: string; tipo_usuario?: string }): Promise<DbUser | null> {
    await this.dataSource.query(
      `INSERT INTO persona.persona_usuario (id_persona, nombre_usuario, contrasena_hash, tipo_usuario, estado_registro)
       VALUES ($1, $2, $3, $4, 'Activo')`,
      [payload.id_persona, payload.nombre_usuario, sha256(payload.password), payload.tipo_usuario || null],
    );
    return this.getUserByIdPersona(payload.id_persona);
  }

  async updatePassword(idPersona: string, newPassword: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE persona.persona_usuario
       SET contrasena_hash = $2, fecha_modificacion = NOW()
       WHERE id_persona = $1`,
      [idPersona, sha256(newPassword)],
    );
  }

  async activateUser(idPersona: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE persona.persona_usuario
       SET estado_registro = 'Activo', fecha_modificacion = NOW()
       WHERE id_persona = $1`,
      [idPersona],
    );
  }

  async getAvailableActionToken(idPersona: string, action: string): Promise<{ token_hash: string } | null> {
    const rows = await this.dataSource.query(
      `SELECT token_hash
       FROM seguridad.usuario_token_accion
       WHERE id_persona = $1
         AND accion = $2
         AND fecha_usado IS NULL
         AND fecha_revocado IS NULL
         AND fecha_expiracion > NOW()
         AND estado_registro = 'Activo'
       ORDER BY fecha_expiracion DESC
       LIMIT 1`,
      [idPersona, action],
    ) as Array<{ token_hash: string }>;
    return rows[0] || null;
  }

  async markTokensAsUsed(idPersona: string, action: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE seguridad.usuario_token_accion
       SET fecha_usado = NOW(), estado_registro = 'Usado'
       WHERE id_persona = $1 AND accion = $2 AND fecha_usado IS NULL AND fecha_revocado IS NULL`,
      [idPersona, action],
    );
  }

  async generateActionToken(idPersona: string, action: string): Promise<{ token: string; fecha_expiracion: string }> {
    await this.dataSource.query(
      `UPDATE seguridad.usuario_token_accion
       SET fecha_revocado = NOW(), estado_registro = 'Revocado'
       WHERE id_persona = $1 AND accion = $2 AND fecha_usado IS NULL AND fecha_revocado IS NULL`,
      [idPersona, action],
    );

    const token = String(Math.floor(10000 + Math.random() * 90000));
    const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000);
    await this.dataSource.query(
      `INSERT INTO seguridad.usuario_token_accion (id_persona, accion, token_hash, fecha_expiracion, estado_registro, id_usuario_creador)
       VALUES ($1, $2, $3, $4, 'Activo', $1)`,
      [idPersona, action, sha256(token), fechaExpiracion],
    );
    return { token, fecha_expiracion: fechaExpiracion.toISOString() };
  }
}
