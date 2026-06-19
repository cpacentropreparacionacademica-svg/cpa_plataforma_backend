import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { ServiciosEducativosController } from './servicios_educativos.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [ServiciosEducativosController],
})
export class ServiciosEducativosModule {}
