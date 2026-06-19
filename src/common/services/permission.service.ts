import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(private readonly dataSource: DataSource) {}

  async hasPermission(idPersona: string, permissionCode: string): Promise<boolean> {
    if (!idPersona || !permissionCode) return false;

    const superUserRows = await this.dataSource.query(
      `SELECT es_super_usuario FROM persona.persona_usuario
       WHERE id_persona = $1 AND COALESCE(estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
       LIMIT 1`,
      [idPersona],
    ) as Array<{ es_super_usuario: boolean }>;

    if (superUserRows[0]?.es_super_usuario) return true;

    const rows = await this.dataSource.query(
      `WITH direct_denied AS (
          SELECT up.id_permiso
          FROM seguridad.usuario_permiso up
          INNER JOIN seguridad.permiso p ON p.id_permiso = up.id_permiso
          WHERE up.id_persona = $1 AND p.codigo = $2 AND up.permitido = false
        ), direct_allowed AS (
          SELECT p.id_permiso
          FROM seguridad.usuario_permiso up
          INNER JOIN seguridad.permiso p ON p.id_permiso = up.id_permiso
          WHERE up.id_persona = $1 AND p.codigo = $2 AND up.permitido = true
            AND COALESCE(p.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
        ), role_allowed AS (
          SELECT p.id_permiso
          FROM seguridad.usuario_rol ur
          INNER JOIN seguridad.rol r ON r.id_rol = ur.id_rol
          INNER JOIN seguridad.rol_permiso rp ON rp.id_rol = r.id_rol
          INNER JOIN seguridad.permiso p ON p.id_permiso = rp.id_permiso
          WHERE ur.id_persona = $1 AND p.codigo = $2
            AND COALESCE(ur.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
            AND COALESCE(r.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
            AND COALESCE(p.estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')
        )
        SELECT 1
        FROM (
          SELECT * FROM direct_allowed
          UNION
          SELECT * FROM role_allowed
        ) allowed
        WHERE NOT EXISTS (SELECT 1 FROM direct_denied)
        LIMIT 1`,
      [idPersona, permissionCode],
    ) as Array<Record<string, unknown>>;

    return rows.length > 0;
  }
}
