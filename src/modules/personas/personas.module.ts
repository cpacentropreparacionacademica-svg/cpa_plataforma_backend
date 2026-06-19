import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { PersonasController } from './personas.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [PersonasController],
})
export class PersonasModule {}
