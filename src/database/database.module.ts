import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getPositiveInteger } from '../config/runtime-config.util';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('PGHOST'),
        port: getPositiveInteger(config, 'PGPORT', 5432),
        username: config.getOrThrow<string>('PGUSER'),
        password: config.getOrThrow<string>('PGPASSWORD'),
        database: config.getOrThrow<string>('PGDATABASE'),
        autoLoadEntities: false,
        entities: [],
        synchronize: false,
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
        ssl: config.get<string>('PGSSLMODE', 'disable') === 'require'
          ? { rejectUnauthorized: config.get<string>('PGSSL_REJECT_UNAUTHORIZED', 'true') === 'true' }
          : false,
        extra: {
          max: getPositiveInteger(config, 'DB_POOL_MAX', 10),
          min: Number(config.get<string>('DB_POOL_MIN', '1')),
          idleTimeoutMillis: getPositiveInteger(config, 'DB_POOL_IDLE_MS', 30000),
          connectionTimeoutMillis: getPositiveInteger(config, 'DB_POOL_ACQUIRE_MS', 10000),
          statement_timeout: getPositiveInteger(config, 'DB_STATEMENT_TIMEOUT_MS', 15000),
          query_timeout: getPositiveInteger(config, 'DB_QUERY_TIMEOUT_MS', 20000),
          application_name: 'cpa-platform-backend',
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
