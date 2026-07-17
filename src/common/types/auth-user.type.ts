export interface AuthUser {
  id_persona: string;
  idPersona: string;
  nombre_usuario?: string | null;
  tipo_usuario?: string | null;
  email?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  es_super_usuario?: boolean;
  id_sesion?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    sessionToken?: string;
    requestId?: string;
    sessionTransport?: 'cookie' | 'header';
  }
}
