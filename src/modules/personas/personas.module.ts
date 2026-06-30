import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { CommonModule } from '../../common/common.module';
import { PersonasController } from './personas.controller';
import { PersonasLifecycleService } from './personas-lifecycle.service';

@Module({
  imports: [SharedCrudModule, CommonModule],
  controllers: [PersonasController],
  providers: [PersonasLifecycleService],
})
export class PersonasModule {}
