import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

/**
 * Exige un permiso explícito en endpoints que no resuelven `:resourcePath`.
 *
 * PermissionGuard deriva el permiso desde el registro de recursos usando el parámetro
 * de ruta `:resourcePath`. Los endpoints con ruta literal (por ejemplo
 * `POST /api/contabilidad/venta-clase/registrar-batch`) no tienen ese parámetro, por lo
 * que el guard no encontraba permiso que evaluar y dejaba pasar la petición.
 * Este decorador declara el permiso de forma explícita para esos casos.
 */
export const RequirePermission = (permission: string) => SetMetadata(REQUIRE_PERMISSION_KEY, permission);
