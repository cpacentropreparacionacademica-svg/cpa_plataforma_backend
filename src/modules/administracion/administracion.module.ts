import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { CommonModule } from '../../common/common.module';
import { AdministracionController } from './administracion.controller';
import { AdministracionLifecycleService } from './administracion-lifecycle.service';

@Module({
  imports: [SharedCrudModule, CommonModule],
  controllers: [AdministracionController],
  providers: [AdministracionLifecycleService],
})
export class AdministracionModule {}
