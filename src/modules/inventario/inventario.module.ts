import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { InventarioController } from './inventario.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [InventarioController],
})
export class InventarioModule {}
