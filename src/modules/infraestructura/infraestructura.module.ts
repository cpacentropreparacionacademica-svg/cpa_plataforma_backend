import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { InfraestructuraController } from './infraestructura.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [InfraestructuraController],
})
export class InfraestructuraModule {}
