import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import { CommonModule } from './common/common.module';
import { CsrfOriginGuard } from './common/guards/csrf-origin.guard';
import { OpaqueSessionGuard } from './common/guards/opaque-session.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { RedisRateLimitGuard } from './common/guards/redis-rate-limit.guard';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { validateEnvironment } from './config/environment.schema';
import { DatabaseModule } from './database/database.module';
import { AdministracionModule } from './modules/administracion/administracion.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module';
import { DeudaModule } from './modules/deuda/deuda.module';
import { HealthModule } from './modules/health/health.module';
import { InfraestructuraModule } from './modules/infraestructura/infraestructura.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { PersonasModule } from './modules/personas/personas.module';
import { ReporteriaModule } from './modules/reporteria/reporteria.module';
import { SeguridadModule } from './modules/seguridad/seguridad.module';
import { ServiciosEducativosModule } from './modules/servicios_educativos/servicios_educativos.module';
import { SocietarioModule } from './modules/societario/societario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: false, validate: validateEnvironment }),
    DatabaseModule,
    CommonModule,
    ApiGatewayModule,
    HealthModule,
    AuthModule,
    AdministracionModule,
    ContabilidadModule,
    DeudaModule,
    InfraestructuraModule,
    InventarioModule,
    PersonasModule,
    SeguridadModule,
    ServiciosEducativosModule,
    SocietarioModule,
    ReporteriaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RedisRateLimitGuard },
    { provide: APP_GUARD, useClass: OpaqueSessionGuard },
    { provide: APP_GUARD, useClass: CsrfOriginGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
