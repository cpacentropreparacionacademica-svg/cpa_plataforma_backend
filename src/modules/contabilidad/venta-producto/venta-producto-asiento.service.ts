import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  AsientoMovimiento,
  assertBalanced,
  resolveCuentaOperativaId,
  toMoneyNumber,
} from '../../../common/utils/accounting.util';
import { LineaValuada, VentaProductoNormalized } from './venta-producto.types';

const CUENTA_EFECTIVO = { config: 'CANAL_COBRO_EFECTIVO', codigo: '1.1.01.001', label: 'cuenta de caja efectivo' };
const CUENTA_QR = { config: 'CANAL_COBRO_QR', codigo: '1.1.01.013', label: 'cuenta de QR / pagos móviles' };
const CUENTA_INGRESO = {
  config: 'INGRESO_VENTA_PRODUCTO_TIENDA',
  codigo: '4.1.05.001',
  label: 'cuenta de ingreso por venta de productos de tienda',
};
const CUENTA_COSTO = {
  config: 'COSTO_VENTA_PRODUCTO_TIENDA',
  codigo: '5.7.001',
  label: 'cuenta de costo de venta de productos de tienda',
};
const CUENTA_EXISTENCIAS = {
  config: 'EXISTENCIAS_PRODUCTO_TIENDA',
  codigo: '1.1.08.001',
  label: 'cuenta de existencias de productos de tienda',
};

/** Importes efectivamente aplicados a la venta, ya descontado el cambio entregado. */
export interface CobroAplicado {
  efectivo: number;
  qr: number;
}

/**
 * Construye el asiento de una venta de mostrador. Son dos hechos económicos
 * en una sola transacción:
 *   1) el cobro:  Debe Caja/QR         · Haber Ingreso
 *   2) el costo:  Debe Costo de venta  · Haber Existencias
 * Cada bien puede sobreescribir sus cuentas propias (inventario.bien.id_cuenta_*);
 * si no las declara, se usa la cuenta operativa configurada.
 */
@Injectable()
export class VentaProductoAsientoService {
  async construir(
    manager: EntityManager,
    venta: VentaProductoNormalized,
    lineas: LineaValuada[],
    cobro: CobroAplicado,
  ): Promise<AsientoMovimiento[]> {
    const movimientos: AsientoMovimiento[] = [];

    if (cobro.efectivo > 0) {
      movimientos.push({
        id_cuenta: await this.cuentaOperativa(manager, CUENTA_EFECTIVO, venta.source.id_cuenta_efectivo),
        debe: cobro.efectivo,
        haber: 0,
      });
    }

    if (cobro.qr > 0) {
      movimientos.push({
        id_cuenta: await this.cuentaOperativa(manager, CUENTA_QR, venta.source.id_cuenta_qr),
        debe: cobro.qr,
        haber: 0,
      });
    }

    await this.agregarIngresos(manager, venta, lineas, movimientos);
    await this.agregarCostos(manager, venta, lineas, movimientos);

    assertBalanced(movimientos);
    return movimientos;
  }

  /** Agrupa el ingreso por cuenta: un bien con cuenta propia no se mezcla con el resto. */
  private async agregarIngresos(
    manager: EntityManager,
    venta: VentaProductoNormalized,
    lineas: LineaValuada[],
    movimientos: AsientoMovimiento[],
  ): Promise<void> {
    const porCuenta = new Map<number, number>();

    for (const linea of lineas) {
      const idCuenta =
        linea.bien.idCuentaIngreso ??
        (await this.cuentaOperativa(manager, CUENTA_INGRESO, venta.source.id_cuenta_ingreso));
      porCuenta.set(idCuenta, toMoneyNumber((porCuenta.get(idCuenta) ?? 0) + linea.montoTotal));
    }

    for (const [idCuenta, monto] of porCuenta) {
      if (monto > 0) movimientos.push({ id_cuenta: idCuenta, debe: 0, haber: monto });
    }
  }

  private async agregarCostos(
    manager: EntityManager,
    venta: VentaProductoNormalized,
    lineas: LineaValuada[],
    movimientos: AsientoMovimiento[],
  ): Promise<void> {
    const costoPorCuenta = new Map<number, number>();
    const existenciaPorCuenta = new Map<number, number>();

    for (const linea of lineas) {
      if (linea.costoTotal <= 0) continue;

      const idCuentaCosto =
        linea.bien.idCuentaCostoVenta ??
        (await this.cuentaOperativa(manager, CUENTA_COSTO, venta.source.id_cuenta_costo_venta));
      const idCuentaExistencias =
        linea.bien.idCuentaExistencias ??
        (await this.cuentaOperativa(manager, CUENTA_EXISTENCIAS, venta.source.id_cuenta_existencias));

      costoPorCuenta.set(idCuentaCosto, toMoneyNumber((costoPorCuenta.get(idCuentaCosto) ?? 0) + linea.costoTotal));
      existenciaPorCuenta.set(
        idCuentaExistencias,
        toMoneyNumber((existenciaPorCuenta.get(idCuentaExistencias) ?? 0) + linea.costoTotal),
      );
    }

    for (const [idCuenta, monto] of costoPorCuenta) {
      if (monto > 0) movimientos.push({ id_cuenta: idCuenta, debe: monto, haber: 0 });
    }
    for (const [idCuenta, monto] of existenciaPorCuenta) {
      if (monto > 0) movimientos.push({ id_cuenta: idCuenta, debe: 0, haber: monto });
    }
  }

  private cuentaOperativa(
    manager: EntityManager,
    cuenta: { config: string; codigo: string; label: string },
    explicitId?: unknown,
  ): Promise<number> {
    return resolveCuentaOperativaId(manager, cuenta.config, cuenta.codigo, cuenta.label, explicitId);
  }
}
