import { BadRequestException, Injectable } from '@nestjs/common';
import { toMoneyNumber, toOptionalPositiveInt, toOptionalString } from '../../../common/utils/accounting.util';
import { VentaProductoBody, VentaProductoItem, VentaProductoNormalized } from './venta-producto.types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Traduce el payload del frontend al modelo interno de la venta.
 * Vive separado del servicio para que la validación de entrada se pueda probar
 * sin base de datos y para que el orquestador no mezcle parseo con escritura.
 */
@Injectable()
export class VentaProductoNormalizer {
  normalize(payload: VentaProductoBody): VentaProductoNormalized {
    const source = payload && typeof payload === 'object' ? payload : {};
    const rawItems = Array.isArray(source.items) ? source.items : [];

    if (rawItems.length === 0) {
      throw new BadRequestException('La venta debe incluir al menos un producto en items.');
    }
    if (rawItems.length > 100) {
      throw new BadRequestException('Una venta no puede superar 100 líneas de producto.');
    }

    const items = rawItems.map((item, index) => this.normalizeItem(item, index + 1));
    const montoEfectivo = this.readAmount(source, ['monto_efectivo', 'efectivo'], 'monto_efectivo');
    const montoQr = this.readAmount(source, ['monto_qr', 'qr'], 'monto_qr');

    if (montoEfectivo + montoQr <= 0) {
      throw new BadRequestException('La venta debe cobrarse en efectivo, por QR o en una combinación de ambos.');
    }

    return {
      fecha: this.readDate(source),
      idTienda: toOptionalPositiveInt(source.id_tienda),
      idSucursal: toOptionalPositiveInt(source.id_sucursal),
      idCliente: toOptionalPositiveInt(source.id_cliente ?? source.id_estudiante),
      idEspacioSalida: toOptionalPositiveInt(source.id_espacio_salida ?? source.id_espacio),
      moneda: (toOptionalString(source.moneda) || 'BOB').slice(0, 3).toUpperCase(),
      observaciones: toOptionalString(source.observaciones),
      montoEfectivo,
      montoQr,
      items,
      source: source as Record<string, unknown>,
    };
  }

  private normalizeItem(raw: unknown, numeroLinea: number): VentaProductoItem {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new BadRequestException(`La línea ${numeroLinea} no es un objeto válido.`);
    }
    const item = raw as Record<string, unknown>;

    const idBien = toOptionalPositiveInt(item.id_bien ?? item.id_producto_tienda ?? item.id_producto);
    if (!idBien) {
      throw new BadRequestException(`La línea ${numeroLinea} debe indicar id_bien del producto vendido.`);
    }

    const cantidad = toMoneyNumber(item.cantidad ?? 1);
    if (cantidad <= 0) {
      throw new BadRequestException(`La línea ${numeroLinea} debe tener cantidad mayor a cero.`);
    }

    const precioUnitario = toMoneyNumber(item.precio_unitario ?? item.precio ?? 0);
    if (precioUnitario < 0) {
      throw new BadRequestException(`La línea ${numeroLinea} no puede tener precio unitario negativo.`);
    }

    const porcentajeDescuento = toMoneyNumber(item.porcentaje_descuento ?? 0);
    if (porcentajeDescuento < 0 || porcentajeDescuento > 100) {
      throw new BadRequestException(`La línea ${numeroLinea} tiene un porcentaje de descuento fuera de rango.`);
    }

    const montoDescuento = toMoneyNumber(item.monto_descuento ?? 0);
    if (montoDescuento < 0) {
      throw new BadRequestException(`La línea ${numeroLinea} no puede tener descuento negativo.`);
    }

    return {
      idBien,
      cantidad,
      precioUnitario,
      porcentajeDescuento,
      montoDescuento,
      descripcion: toOptionalString(item.descripcion)?.slice(0, 300),
      observaciones: toOptionalString(item.observaciones),
    };
  }

  private readAmount(source: Record<string, unknown>, keys: string[], label: string): number {
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        const amount = toMoneyNumber(source[key]);
        if (amount < 0) throw new BadRequestException(`${label} no puede ser negativo.`);
        return amount;
      }
    }
    return 0;
  }

  private readDate(source: Record<string, unknown>): string {
    const value = toOptionalString(source.fecha ?? source.fecha_transaccion ?? source.fecha_venta);
    if (!value) return new Date().toISOString().slice(0, 10);
    if (!DATE_PATTERN.test(value)) {
      throw new BadRequestException(`La fecha '${value}' debe tener formato YYYY-MM-DD.`);
    }
    return value;
  }
}
