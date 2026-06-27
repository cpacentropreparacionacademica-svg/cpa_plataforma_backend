import { Module } from '@nestjs/common';
import { CrudRepository } from './repositories/crud.repository';
import { ResourceMetadataService } from './services/resource-metadata.service';
import { PermissionService } from './services/permission.service';
import { OpaqueSessionService } from './services/opaque-session.service';
import { RedisService } from './services/redis.service';

@Module({
  providers: [CrudRepository, ResourceMetadataService, PermissionService, OpaqueSessionService, RedisService],
  exports: [CrudRepository, ResourceMetadataService, PermissionService, OpaqueSessionService, RedisService],
})
export class CommonModule {}
