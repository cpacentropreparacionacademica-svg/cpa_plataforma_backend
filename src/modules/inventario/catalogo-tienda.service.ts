import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

const MAX_LIMIT = 200;

/**
 * Catálogo que alimenta el grid del punto de venta: sólo productos de tienda
 * activos, con su imagen de Cloudinary, precio y existencia consolidada.
 * Es una lectura dedicada y no el CRUD genérico de `inventario/bien` porque el
 * cajero no debe poder listar ni escribir el resto del inventario.
 */
@Injectable()
export class CatalogoTiendaService {
  constructor(private readonly dataSource: DataSource) {}

  async list(query: Record<string, unknown>) {
    const limit = Math.min(Math.max(Number(query.limit ?? 100) || 100, 1), MAX_LIMIT);
    const page = Math.max(Number(query.page ?? 1) || 1, 1);
    const offset = query.offset !== undefined ? Math.max(Number(query.offset) || 0, 0) : (page - 1) * limit;
    const search = String(query.search ?? '').trim();
    const categoria = String(query.categoria ?? '').trim();
    const soloConStock = String(query.soloConStock ?? query.solo_con_stock ?? '').toLowerCase() === 'true';

    const filters: string[] = [
      'es_producto_tienda = true',
      "COALESCE(estado_registro, 'Activo') IN ('Activo', 'ACTIVO', 'activo')",
    ];
    const values: unknown[] = [];

    if (search) {
      values.push(`%${search}%`);
      filters.push(`(nombre ILIKE $${values.length} OR sku ILIKE $${values.length})`);
    }
    if (categoria) {
      values.push(categoria);
      filters.push(`categoria = $${values.length}`);
    }
    if (soloConStock) {
      filters.push('cantidad_disponible > 0');
    }

    const where = `WHERE ${filters.join(' AND ')}`;
    const countRows = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM inventario.v_stock_bien ${where}`,
      values,
    )) as Array<{ total: number }>;

    const rows = (await this.dataSource.query(
      `SELECT id_bien, sku, nombre, categoria, imagen_url, precio_referencia, moneda_referencia,
              cantidad_disponible, controla_inventario_loteable, controla_inventario_no_loteable
         FROM inventario.v_stock_bien
         ${where}
        ORDER BY nombre ASC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    )) as Array<Record<string, unknown>>;

    const data = rows.map((row) => ({
      id_bien: Number(row.id_bien),
      sku: String(row.sku ?? ''),
      nombre: String(row.nombre ?? ''),
      categoria: row.categoria ?? null,
      imagen_url: row.imagen_url ?? null,
      precio_referencia: Number(row.precio_referencia ?? 0),
      moneda: String(row.moneda_referencia ?? 'BOB'),
      cantidad_disponible: Number(row.cantidad_disponible ?? 0),
      controla_inventario:
        Boolean(row.controla_inventario_loteable) || Boolean(row.controla_inventario_no_loteable),
    }));

    const count = countRows[0]?.total ?? data.length;
    return {
      success: true,
      message: 'Catálogo de tienda listado correctamente.',
      data,
      count,
      total: count,
      limit,
      offset,
      page,
    };
  }
}
