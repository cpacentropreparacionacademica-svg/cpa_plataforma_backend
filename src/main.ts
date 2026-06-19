import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api'));
  app.use(cookieParser());
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression({ level: 6, threshold: 1024 }));

  const origins = config.get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length === 0 ? true : origins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Session-Token'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector), new ResponseEnvelopeInterceptor());

  if (config.get<string>('SWAGGER_ENABLED', 'true') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CPA Plataforma API')
      .setDescription('API REST migrada a NestJS con TypeORM, sesiones opacas y rate limiter sin Redis.')
      .setVersion('2.0.0')
      .addCookieAuth(config.get<string>('SESSION_COOKIE_NAME', 'cpa_session'))
      .addApiKey({ type: 'apiKey', name: 'X-Session-Token', in: 'header' }, 'opaque-session')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs/api', app, document);
  }

  const port = Number(config.get<string>('PORT', '3000'));
  await app.listen(port);
}

void bootstrap();
