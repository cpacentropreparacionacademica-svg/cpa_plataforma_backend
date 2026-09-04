import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { CatalogoTiendaController } from './catalogo-tienda.controller';
import { CatalogoTiendaService } from './catalogo-tienda.service';
import { InventarioController } from './inventario.controller';

@Module({
  imports: [SharedCrudModule],
  /**
   * CatalogoTiendaController va PRIMERO a propósito: InventarioController declara
   * rutas comodín `:resourcePath` que capturarían `inventario/catalogo-tienda`
   * y responderían «recurso no encontrado».
   */
  controllers: [CatalogoTiendaController, InventarioController],
  providers: [CatalogoTiendaService],
})
export class InventarioModule {}
