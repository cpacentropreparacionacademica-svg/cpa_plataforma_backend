import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { ContabilidadController } from './contabilidad.controller';
import { ContabilidadAccountingService } from './contabilidad-accounting.service';
import { ContabilidadArchivoService } from './contabilidad-archivo.service';

@Module({
  imports: [SharedCrudModule],
  controllers: [ContabilidadController],
  providers: [ContabilidadAccountingService, ContabilidadArchivoService],
})
export class ContabilidadModule {}
