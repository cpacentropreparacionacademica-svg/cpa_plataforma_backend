import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { ContabilidadController } from './contabilidad.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [ContabilidadController],
})
export class ContabilidadModule {}
