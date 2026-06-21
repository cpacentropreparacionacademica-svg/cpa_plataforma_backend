import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { ContabilidadController } from './contabilidad.controller';
import { ContabilidadAccountingService } from './contabilidad-accounting.service';

@Module({
  imports: [SharedCrudModule],
  controllers: [ContabilidadController],
  providers: [ContabilidadAccountingService],
})
export class ContabilidadModule {}
