import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { ContabilidadController } from './contabilidad.controller';
import { ContabilidadAccountingService } from './contabilidad-accounting.service';
import { ContabilidadArchivoService } from './contabilidad-archivo.service';
import { ContabilidadEstadosFinancierosService } from './reportes/contabilidad-estados-financieros.service';
import { ContabilidadLibrosService } from './reportes/contabilidad-libros.service';
import { ContabilidadPeriodosService } from './reportes/contabilidad-periodos.service';
import { ContabilidadReportesController } from './reportes/contabilidad-reportes.controller';
import { ContabilidadSelectoresService } from './reportes/contabilidad-selectores.service';
import { VentaProductoAsientoService } from './venta-producto/venta-producto-asiento.service';
import { VentaProductoController } from './venta-producto/venta-producto.controller';
import { VentaProductoNormalizer } from './venta-producto/venta-producto.normalizer';
import { VentaProductoRepository } from './venta-producto/venta-producto.repository';
import { VentaProductoService } from './venta-producto/venta-producto.service';
import { VentaProductoValuacionService } from './venta-producto/venta-producto-valuacion.service';

@Module({
  imports: [SharedCrudModule],
  /**
   * ContabilidadReportesController va PRIMERO a propósito.
   * ContabilidadController declara rutas comodín `:resourcePath/:id`, que capturarían
   * `GET /api/contabilidad/reportes/libro-diario` y responderían «recurso no encontrado».
   * Nest resuelve las rutas en el orden en que se registran los controladores.
   */
  controllers: [ContabilidadReportesController, VentaProductoController, ContabilidadController],
  providers: [
    ContabilidadAccountingService,
    ContabilidadArchivoService,
    ContabilidadLibrosService,
    ContabilidadEstadosFinancierosService,
    ContabilidadPeriodosService,
    ContabilidadSelectoresService,
    VentaProductoNormalizer,
    VentaProductoRepository,
    VentaProductoValuacionService,
    VentaProductoAsientoService,
    VentaProductoService,
  ],
})
export class ContabilidadModule {}
