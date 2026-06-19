import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('PGHOST', 'localhost'),
        port: Number(config.get<string>('PGPORT', '5432')),
        username: config.get<string>('PGUSER', 'postgres'),
        password: config.get<string>('PGPASSWORD', 'postgres'),
        database: config.get<string>('PGDATABASE', 'neondb'),
        autoLoadEntities: false,
        entities: [],
        synchronize: false,
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
        ssl: config.get<string>('PGSSLMODE', 'disable') === 'require' ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
