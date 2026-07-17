import { Module } from '@nestjs/common';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { CrudRepository } from './repositories/crud.repository';
import { PasswordHasherService } from './security/password-hasher.service';
import { OpaqueSessionService } from './services/opaque-session.service';
import { PermissionService } from './services/permission.service';
import { RedisService } from './services/redis.service';
import { ResourceMetadataService } from './services/resource-metadata.service';

@Module({
  providers: [
    CrudRepository,
    ResourceMetadataService,
    PermissionService,
    OpaqueSessionService,
    RedisService,
    PasswordHasherService,
    RequestContextMiddleware,
  ],
  exports: [
    CrudRepository,
    ResourceMetadataService,
    PermissionService,
    OpaqueSessionService,
    RedisService,
    PasswordHasherService,
  ],
})
export class CommonModule {}
