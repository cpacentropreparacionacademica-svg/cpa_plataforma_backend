import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdministracionModule } from './modules/administracion/administracion.module';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module';
import { DeudaModule } from './modules/deuda/deuda.module';
import { InfraestructuraModule } from './modules/infraestructura/infraestructura.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { PersonasModule } from './modules/personas/personas.module';
import { SeguridadModule } from './modules/seguridad/seguridad.module';
import { ServiciosEducativosModule } from './modules/servicios_educativos/servicios_educativos.module';
import { SocietarioModule } from './modules/societario/societario.module';
import { ReporteriaModule } from './modules/reporteria/reporteria.module';
import { RedisRateLimitGuard } from './common/guards/redis-rate-limit.guard';
import { OpaqueSessionGuard } from './common/guards/opaque-session.guard';
import { PermissionGuard } from './common/guards/permission.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
