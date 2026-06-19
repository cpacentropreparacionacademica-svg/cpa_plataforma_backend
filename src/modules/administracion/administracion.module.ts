import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { AdministracionController } from './administracion.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [AdministracionController],
})
export class AdministracionModule {}
