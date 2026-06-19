import { BadRequestException, ConflictException, HttpException } from '@nestjs/common';

type DatabaseErrorLike = {
  code?: string;
  detail?: string;
  message?: string;
  table?: string;
  column?: string;
  constraint?: string;
};

type QueryFailedErrorLike = {
  code?: string;
  detail?: string;
  message?: string;
  table?: string;
  column?: string;
  constraint?: string;
  driverError?: DatabaseErrorLike;
};

function asQueryFailedErrorLike(error: unknown): QueryFailedErrorLike {
  if (!error || typeof error !== 'object') return {};
  return error as QueryFailedErrorLike;
}

function sanitize(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return String(value).replace(/\s+/g, ' ').trim();
}

/**
 * Convierte errores conocidos de PostgreSQL a errores HTTP controlados.
 * Esto evita exponer errores de base de datos como 500 cuando el problema
 * es una solicitud incompleta o inválida del cliente.
 */
export function toHttpDatabaseException(error: unknown): HttpException | null {
  const queryError = asQueryFailedErrorLike(error);
  const driverError = queryError.driverError || queryError;
  const code = driverError.code || queryError.code;
  const table = sanitize(driverError.table || queryError.table);
  const column = sanitize(driverError.column || queryError.column);
  const constraint = sanitize(driverError.constraint || queryError.constraint);
  const detail = sanitize(driverError.detail || queryError.detail);

  switch (code) {
    case '23502': {
      const fieldMessage = column ? `El campo ${column} es obligatorio.` : 'Faltan campos obligatorios.';
      const tableMessage = table ? ` Tabla: ${table}.` : '';
      return new BadRequestException(`${fieldMessage}${tableMessage}`);
    }
    case '23503': {
      const constraintMessage = constraint ? ` Restricción: ${constraint}.` : '';
      const detailMessage = detail ? ` ${detail}` : '';
      return new BadRequestException(`La solicitud referencia un registro relacionado inexistente.${constraintMessage}${detailMessage}`);
    }
    case '23505': {
      const detailMessage = detail ? ` ${detail}` : '';
      return new ConflictException(`El registro ya existe o viola una restricción única.${detailMessage}`);
    }
    case '23514': {
      const constraintMessage = constraint ? ` Restricción: ${constraint}.` : '';
      return new BadRequestException(`La solicitud no cumple una regla de validación de la base de datos.${constraintMessage}`);
    }
    case '22P02':
      return new BadRequestException('Uno o más identificadores tienen un formato inválido para la base de datos.');
    case '22001':
      return new BadRequestException('Uno o más campos superan la longitud permitida.');
    case '22007':
    case '22008':
      return new BadRequestException('Uno o más campos de fecha/hora tienen un formato inválido.');
    default:
      return null;
  }
}
