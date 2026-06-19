import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { DeudaController } from './deuda.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [DeudaController],
})
export class DeudaModule {}
