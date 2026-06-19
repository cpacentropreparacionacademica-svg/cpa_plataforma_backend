import { Module } from '@nestjs/common';
import { SharedCrudModule } from '../shared-crud/shared-crud.module';
import { SocietarioController } from './societario.controller';

@Module({
  imports: [SharedCrudModule],
  controllers: [SocietarioController],
})
export class SocietarioModule {}
