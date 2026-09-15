import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VentaProductoNormalizer } from '../src/modules/contabilidad/venta-producto/venta-producto.normalizer';
import { VentaProductoValuacionService } from '../src/modules/contabilidad/venta-producto/venta-producto-valuacion.service';
import { BienVendible } from '../src/modules/contabilidad/venta-producto/venta-producto.types';
import { assertBalanced, sumMovimientos, toMoneyNumber } from '../src/common/utils/accounting.util';

function crearBien(overrides: Partial<BienVendible> = {}): BienVendible {
  return {
    idBien: 1,
    sku: 'SKU-1',
    nombre: 'Cuaderno',
    tipo: 'MERCADERIA',
    esProductoTienda: true,
    controlaInventario: true,
    metodoValuacion: 'PEPS',
    costoReferencia: 5,
    precioReferencia: 12,
    cantidadDisponible: 10,
    costoPromedio: 6,
    ...overrides,
  };
}

/** EntityManager mínimo: sólo se usa `query` para devolver los lotes disponibles. */
function managerConLotes(lotes: Array<Record<string, unknown>>): EntityManager {
  return {
    query: jest.fn().mockResolvedValue(lotes),
  } as unknown as EntityManager;
}

describe('VentaProductoNormalizer', () => {
  const normalizer = new VentaProductoNormalizer();

  it('normaliza una venta simple con pago en efectivo', () => {
    const venta = normalizer.normalize({
      fecha: '2026-09-03',
      monto_efectivo: 50,
      items: [{ id_bien: 3, cantidad: 2, precio_unitario: 12.5 }],
    });

    expect(venta.fecha).toBe('2026-09-03');
    expect(venta.montoEfectivo).toBe(50);
    expect(venta.montoQr).toBe(0);
    expect(venta.moneda).toBe('BOB');
    expect(venta.items).toEqual([
      {
        idBien: 3,
        cantidad: 2,
        precioUnitario: 12.5,
        porcentajeDescuento: 0,
        montoDescuento: 0,
        descripcion: undefined,
        observaciones: undefined,
      },
    ]);
  });

  it('rechaza una venta sin líneas', () => {
    expect(() => normalizer.normalize({ monto_efectivo: 10, items: [] })).toThrow(BadRequestException);
  });

  it('rechaza una venta sin forma de pago', () => {
    expect(() => normalizer.normalize({ items: [{ id_bien: 1, cantidad: 1 }] })).toThrow(
      /efectivo, por QR o en una combinación/,
    );
  });

  it('rechaza una línea sin producto', () => {
    expect(() => normalizer.normalize({ monto_efectivo: 10, items: [{ cantidad: 1 }] })).toThrow(/id_bien/);
  });

  it('rechaza cantidades no positivas', () => {
    expect(() => normalizer.normalize({ monto_efectivo: 10, items: [{ id_bien: 1, cantidad: 0 }] })).toThrow(
      /cantidad mayor a cero/,
    );
  });

  it('rechaza una fecha con formato inválido', () => {
    expect(() =>
      normalizer.normalize({ fecha: '03/09/2026', monto_efectivo: 10, items: [{ id_bien: 1, cantidad: 1 }] }),
    ).toThrow(/YYYY-MM-DD/);
  });
});

describe('VentaProductoValuacionService', () => {
  const valuacion = new VentaProductoValuacionService();

  const lotes = [
    { id_lote: 1, fecha_compra: '2026-01-01', costo_unitario: 4, cantidad_disponible: 3 },
    { id_lote: 2, fecha_compra: '2026-02-01', costo_unitario: 6, cantidad_disponible: 5 },
  ];

  it('PEPS consume primero el lote más antiguo', async () => {
    const consumos = await valuacion.resolverConsumos(managerConLotes(lotes), crearBien(), 4);

    expect(consumos).toEqual([
      { idLote: 1, cantidad: 3, costoUnitario: 4 },
      { idLote: 2, cantidad: 1, costoUnitario: 6 },
    ]);
  });

  it('UEPS consume primero el lote que la vista devuelve como más reciente', async () => {
    const lotesUeps = [...lotes].reverse();
    const consumos = await valuacion.resolverConsumos(
      managerConLotes(lotesUeps),
      crearBien({ metodoValuacion: 'UEPS' }),
      2,
    );

    expect(consumos).toEqual([{ idLote: 2, cantidad: 2, costoUnitario: 6 }]);
  });

  it('PROM aplica el mismo costo promedio ponderado a todos los lotes consumidos', async () => {
    const consumos = await valuacion.resolverConsumos(
      managerConLotes(lotes),
      crearBien({ metodoValuacion: 'PROM' }),
      4,
    );

    // (3 * 4 + 5 * 6) / 8 = 5.25
    expect(consumos.every((consumo) => consumo.costoUnitario === 5.25)).toBe(true);
    expect(consumos.reduce((total, consumo) => total + consumo.cantidad, 0)).toBe(4);
  });

  it('rechaza la venta cuando el stock de los lotes no alcanza', async () => {
    await expect(
      valuacion.resolverConsumos(managerConLotes(lotes), crearBien({ cantidadDisponible: 8 }), 9),
    ).rejects.toThrow(/Stock insuficiente/);
  });

  it('valúa al costo de referencia los bienes que no controlan inventario', async () => {
    const consumos = await valuacion.resolverConsumos(
      managerConLotes([]),
      crearBien({ controlaInventario: false, costoReferencia: 7 }),
      3,
    );

    expect(consumos).toEqual([{ cantidad: 3, costoUnitario: 7 }]);
  });

  it('usa el costo promedio del bien cuando la mercadería no es loteable', async () => {
    const consumos = await valuacion.resolverConsumos(
      managerConLotes([]),
      crearBien({ costoPromedio: 9, cantidadDisponible: 5 }),
      2,
    );

    expect(consumos).toEqual([{ cantidad: 2, costoUnitario: 9 }]);
  });
});

describe('asiento de la venta', () => {
  it('cuadra cobro, ingreso, costo y existencias', () => {
    const movimientos = [
      { id_cuenta: 10, debe: 40, haber: 0 }, // caja
      { id_cuenta: 20, debe: 0, haber: 40 }, // ingreso
      { id_cuenta: 30, debe: 18, haber: 0 }, // costo de venta
      { id_cuenta: 40, debe: 0, haber: 18 }, // existencias
    ];

    expect(() => assertBalanced(movimientos)).not.toThrow();
    expect(sumMovimientos(movimientos)).toEqual({ debe: 58, haber: 58 });
  });

  it('rechaza un asiento descuadrado', () => {
    expect(() =>
      assertBalanced([
        { id_cuenta: 10, debe: 50, haber: 0 },
        { id_cuenta: 20, debe: 0, haber: 40 },
      ]),
    ).toThrow(/no está balanceado/);
  });

  it('redondea los importes a dos decimales', () => {
    expect(toMoneyNumber('12.345')).toBe(12.35);
    expect(toMoneyNumber(null)).toBe(0);
    expect(() => toMoneyNumber('no-es-un-numero')).toThrow(BadRequestException);
  });
});
