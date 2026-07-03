import { Module } from '@nestjs/common';
import { ReporteriaController } from './reporteria.controller';
import { ReporteriaContabilidadService } from './reporteria-contabilidad.service';

@Module({
  controllers: [ReporteriaController],
  providers: [ReporteriaContabilidadService],
})
export class ReporteriaModule {}
