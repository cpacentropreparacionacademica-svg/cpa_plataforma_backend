import { Module } from '@nestjs/common';
import { CrudRepository } from './repositories/crud.repository';
import { ResourceMetadataService } from './services/resource-metadata.service';
import { PermissionService } from './services/permission.service';
import { OpaqueSessionService } from './services/opaque-session.service';

@Module({
  providers: [CrudRepository, ResourceMetadataService, PermissionService, OpaqueSessionService],
  exports: [CrudRepository, ResourceMetadataService, PermissionService, OpaqueSessionService],
})
export class CommonModule {}
