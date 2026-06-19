import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AuthUser } from '../types/auth-user.type';
import { generateOpaqueToken, sha256 } from '../utils/crypto.util';

@Injectable()
export class OpaqueSessionService {
  constructor(private readonly dataSource: DataSource, private readonly config: ConfigService) {}

  async createSession(params: { idPersona: string; ip?: string | null; userAgent?: string | null }): Promise<{ session: unknown; token: string }> {
    const token = generateOpaqueToken();
    const tokenHash = sha256(token);
    const metadata = { sessionTokenHash: tokenHash };

    const rows = await this.dataSource.query(
      `INSERT INTO seguridad.sesion (id_persona, ip_acceso, user_agent, tipo_login, esta_activa, metadata)
       VALUES ($1, $2, $3, 'PASSWORD', true, $4::jsonb)
       RETURNING *`,
      [params.idPersona, params.ip || null, params.userAgent || null, JSON.stringify(metadata)],
    ) as unknown[];

    return { session: rows[0], token };
  }

  async getUserFromSessionToken(token: string): Promise<AuthUser | null> {
    const tokenHash = sha256(token);
    const ttlMinutes = Number(this.config.get<string>('SESSION_TTL_MINUTES', '480'));

    const rows = await this.dataSource.query(
      `SELECT
          s.id_sesion,
          u.id_persona,
          u.nombre_usuario,
          u.tipo_usuario,
          u.es_super_usuario,
          p.email,
          p.nombres,
          p.apellidos
       FROM seguridad.sesion s
       INNER JOIN persona.persona_usuario u ON u.id_persona = s.id_persona
       LEFT JOIN persona.persona p ON p.id_persona = u.id_persona
       WHERE s.esta_activa = true
         AND s.timestamp_logout IS NULL
         AND s.metadata->>'sessionTokenHash' = $1
         AND s.timestamp_login >= NOW() - ($2 || ' minutes')::interval
       LIMIT 1`,
      [tokenHash, ttlMinutes],
    ) as Array<AuthUser & { id_sesion: string }>;

    const user = rows[0];
    if (!user) return null;
    return { ...user, idPersona: String(user.id_persona), id_persona: String(user.id_persona), id_sesion: String(user.id_sesion) };
  }

  async closeSession(token: string): Promise<void> {
    const tokenHash = sha256(token);
    await this.dataSource.query(
      `UPDATE seguridad.sesion
       SET esta_activa = false, timestamp_logout = NOW(), tipo_logout = 'MANUAL'
       WHERE metadata->>'sessionTokenHash' = $1 AND timestamp_logout IS NULL`,
      [tokenHash],
    );
  }
}
