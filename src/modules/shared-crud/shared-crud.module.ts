import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { CrudService } from './crud.service';

@Module({
  imports: [CommonModule],
  providers: [CrudService],
  exports: [CrudService],
})
export class SharedCrudModule {}
