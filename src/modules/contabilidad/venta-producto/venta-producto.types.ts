/** Contrato de entrada y salida del punto de venta de productos de tienda. */

export type VentaProductoBody = Record<string, unknown> & {
  fecha?: unknown;
  id_tienda?: unknown;
  items?: unknown;
  monto_efectivo?: unknown;
  monto_qr?: unknown;
};

export interface VentaProductoItem {
  idBien: number;
  cantidad: number;
  precioUnitario: number;
  porcentajeDescuento: number;
  montoDescuento: number;
  descripcion?: string;
  observaciones?: string;
}

export interface VentaProductoNormalized {
  fecha: string;
  idTienda?: number;
  idSucursal?: number;
  idCliente?: number;
  idEspacioSalida?: number;
  moneda: string;
  observaciones?: string;
  montoEfectivo: number;
  montoQr: number;
  items: VentaProductoItem[];
  source: Record<string, unknown>;
}

/** Un bien tal como lo necesita la venta: precio, método de valuación y cuentas propias. */
export interface BienVendible {
  idBien: number;
  sku: string;
  nombre: string;
  tipo: string;
  esProductoTienda: boolean;
  controlaInventario: boolean;
  metodoValuacion: 'PEPS' | 'UEPS' | 'PROM';
  costoReferencia: number;
  precioReferencia: number;
  cantidadDisponible: number;
  costoPromedio: number;
  idCuentaIngreso?: number;
  idCuentaCostoVenta?: number;
  idCuentaExistencias?: number;
}

/** Consumo resuelto sobre un lote concreto, o sobre el bien cuando no es loteable. */
export interface ConsumoLote {
  idLote?: number;
  cantidad: number;
  costoUnitario: number;
}

export interface LineaValuada {
  item: VentaProductoItem;
  bien: BienVendible;
  numeroLinea: number;
  montoSubtotal: number;
  montoTotal: number;
  costoTotal: number;
  consumos: ConsumoLote[];
}
