import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { toMoneyNumber } from '../../../common/utils/accounting.util';
import { BienVendible, ConsumoLote } from './venta-producto.types';

interface LoteDisponible {
  idLote: number;
  fechaCompra: string;
  costoUnitario: number;
  cantidadDisponible: number;
}

/** Orden de consumo de lotes por método de valuación. */
const ORDEN_POR_METODO: Record<BienVendible['metodoValuacion'], 'ASC' | 'DESC'> = {
  PEPS: 'ASC',
  UEPS: 'DESC',
  PROM: 'ASC',
};

/**
 * Resuelve de qué lotes sale la mercadería vendida y a qué costo.
 * Aísla la política de valuación: añadir un método nuevo es añadir una entrada
 * a ORDEN_POR_METODO o una rama en `resolverConsumos`, sin tocar el orquestador.
 */
@Injectable()
export class VentaProductoValuacionService {
  async resolverConsumos(manager: EntityManager, bien: BienVendible, cantidad: number): Promise<ConsumoLote[]> {
    if (!bien.controlaInventario) {
      // Servicios y bienes sin control de existencias se valúan al costo de referencia.
      return [{ cantidad, costoUnitario: toMoneyNumber(bien.costoReferencia) }];
    }

    const lotes = await this.listarLotesDisponibles(manager, bien);

    if (lotes.length === 0) {
      return this.consumoSinLotes(bien, cantidad);
    }

    return bien.metodoValuacion === 'PROM'
      ? this.consumirPromedio(bien, lotes, cantidad)
      : this.consumirPorOrden(bien, lotes, cantidad);
  }

  private async listarLotesDisponibles(manager: EntityManager, bien: BienVendible): Promise<LoteDisponible[]> {
    const direccion = ORDEN_POR_METODO[bien.metodoValuacion];
    const rows = (await manager.query(
      `SELECT id_lote, fecha_compra, costo_unitario, cantidad_disponible
         FROM inventario.v_stock_bien_lote
        WHERE id_bien = $1 AND cantidad_disponible > 0
        ORDER BY fecha_compra ${direccion}, id_lote ${direccion}`,
      [bien.idBien],
    )) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      idLote: Number(row.id_lote),
      fechaCompra: String(row.fecha_compra ?? ''),
      costoUnitario: toMoneyNumber(row.costo_unitario),
      cantidadDisponible: Number(row.cantidad_disponible),
    }));
  }

  /**
   * Mercadería no loteable: la existencia se lleva a nivel de bien, así que se
   * verifica el saldo global y se valúa al costo promedio publicado por la vista.
   */
  private consumoSinLotes(bien: BienVendible, cantidad: number): ConsumoLote[] {
    if (bien.controlaInventario && bien.cantidadDisponible < cantidad) {
      throw new BadRequestException(this.mensajeStock(bien, cantidad));
    }
    const costoUnitario = toMoneyNumber(bien.costoPromedio || bien.costoReferencia);
    return [{ cantidad, costoUnitario }];
  }

  private consumirPorOrden(bien: BienVendible, lotes: LoteDisponible[], cantidad: number): ConsumoLote[] {
    const consumos: ConsumoLote[] = [];
    let pendiente = cantidad;

    for (const lote of lotes) {
      if (pendiente <= 0) break;
      const tomado = Math.min(pendiente, lote.cantidadDisponible);
      consumos.push({ idLote: lote.idLote, cantidad: tomado, costoUnitario: lote.costoUnitario });
      pendiente -= tomado;
    }

    if (pendiente > 0.000001) {
      throw new BadRequestException(this.mensajeStock(bien, cantidad));
    }
    return consumos;
  }

  /**
   * Promedio ponderado: la salida se reparte proporcionalmente entre los lotes
   * disponibles pero todas las líneas comparten el mismo costo unitario, que es
   * justamente lo que distingue PROM de PEPS/UEPS.
   */
  private consumirPromedio(bien: BienVendible, lotes: LoteDisponible[], cantidad: number): ConsumoLote[] {
    const disponible = lotes.reduce((total, lote) => total + lote.cantidadDisponible, 0);
    if (disponible + 0.000001 < cantidad) {
      throw new BadRequestException(this.mensajeStock(bien, cantidad));
    }

    const valorTotal = lotes.reduce((total, lote) => total + lote.cantidadDisponible * lote.costoUnitario, 0);
    const costoPromedio = toMoneyNumber(disponible > 0 ? valorTotal / disponible : bien.costoReferencia);

    const consumos = this.consumirPorOrden(bien, lotes, cantidad);
    return consumos.map((consumo) => ({ ...consumo, costoUnitario: costoPromedio }));
  }

  private mensajeStock(bien: BienVendible, solicitada: number): string {
    return `Stock insuficiente de ${bien.nombre} (SKU ${bien.sku}): se solicitaron ${solicitada} y hay ${bien.cantidadDisponible} disponibles.`;
  }
}
