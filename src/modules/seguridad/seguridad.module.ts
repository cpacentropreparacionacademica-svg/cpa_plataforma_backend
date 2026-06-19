import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { SeguridadController } from './seguridad.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [SeguridadController],
})
export class SeguridadModule {}
