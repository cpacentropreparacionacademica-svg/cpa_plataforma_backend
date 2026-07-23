import { BadRequestException } from '@nestjs/common';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

export type RangoFechas = { desde: string; hasta: string };

export type Paginacion = { page: number; pageSize: number; offset: number };

export type PaginacionRespuesta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/**
 * Todos los filtros de los reportes contables se validan aquí, en backend.
 * El frontend no es una fuente de confianza para rangos, paginación ni ordenamiento.
 */
export function parseFechaObligatoria(value: unknown, campo: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new BadRequestException(`El parámetro ${campo} es obligatorio y debe tener formato YYYY-MM-DD.`);
  }

  const fecha = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`El parámetro ${campo} no es una fecha válida del calendario.`);
  }

  return value;
}

export function parseRangoFechas(query: Record<string, unknown>): RangoFechas {
  const desde = parseFechaObligatoria(query.desde, 'desde');
  const hasta = parseFechaObligatoria(query.hasta, 'hasta');

  if (desde > hasta) {
    throw new BadRequestException('El parámetro desde no puede ser posterior a hasta.');
  }

  return { desde, hasta };
}

export function parsePaginacion(query: Record<string, unknown>): Paginacion {
  const page = parseEnteroPositivo(query.page, 'page', 1);
  const pageSize = parseEnteroPositivo(query.pageSize ?? query.limit, 'pageSize', DEFAULT_PAGE_SIZE);

  if (pageSize > MAX_PAGE_SIZE) {
    throw new BadRequestException(
      `pageSize no puede superar ${MAX_PAGE_SIZE}. La paginación se aplica en el servidor.`,
    );
  }

  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function construirPaginacion(paginacion: Paginacion, totalItems: number): PaginacionRespuesta {
  const totalPages = paginacion.pageSize > 0 ? Math.ceil(totalItems / paginacion.pageSize) : 0;

  return {
    page: paginacion.page,
    pageSize: paginacion.pageSize,
    totalItems,
    totalPages,
    hasNextPage: paginacion.page < totalPages,
    hasPreviousPage: paginacion.page > 1,
  };
}

export function parseEnteroPositivoOpcional(value: unknown, campo: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`El parámetro ${campo} debe ser un entero positivo.`);
  }

  return parsed;
}

export function parseEnteroPositivo(value: unknown, campo: string, porDefecto: number): number {
  return parseEnteroPositivoOpcional(value, campo) ?? porDefecto;
}

/**
 * El ordenamiento se restringe a una lista blanca: nunca se interpola texto del cliente
 * dentro de la cláusula ORDER BY.
 */
export function parseOrden(value: unknown, permitidos: Record<string, string>, porDefecto: string): string {
  if (value === undefined || value === null || value === '') return permitidos[porDefecto];

  const clave = String(value);
  const columna = permitidos[clave];
  if (!columna) {
    throw new BadRequestException(
      `orderBy '${clave}' no está permitido. Valores admitidos: ${Object.keys(permitidos).join(', ')}.`,
    );
  }

  return columna;
}

export function parseDireccionOrden(value: unknown): 'ASC' | 'DESC' {
  if (value === undefined || value === null || value === '') return 'ASC';

  const direccion = String(value).toUpperCase();
  if (direccion !== 'ASC' && direccion !== 'DESC') {
    throw new BadRequestException("orderDir debe ser 'ASC' o 'DESC'.");
  }

  return direccion;
}

/** Los importes viajan como string decimal para no perder precisión en JSON/JavaScript. */
export function toImporte(value: unknown): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}
