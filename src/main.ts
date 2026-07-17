import 'reflect-metadata';
import compression, { filter as compressionFilter } from 'compression';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { parseCorsOrigins } from './config/environment.schema';
import { getPositiveInteger, getTrustProxy } from './config/runtime-config.util';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const expressApplication = app.getHttpAdapter().getInstance();
  const swaggerEnabled = config.get<string>('SWAGGER_ENABLED', 'false') === 'true';

  expressApplication.disable('x-powered-by');
  expressApplication.set('trust proxy', getTrustProxy(config));
  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api'));
  app.use(json({ limit: config.get<string>('JSON_BODY_LIMIT', '1mb'), strict: true }));
  app.use(urlencoded({ extended: false, limit: config.get<string>('URL_ENCODED_BODY_LIMIT', '256kb') }));
  app.use(cookieParser());
  app.use(helmet({ contentSecurityPolicy: swaggerEnabled ? false : undefined, crossOriginResourcePolicy: { policy: 'same-origin' } }));
  app.use(compression({
    level: 4,
    threshold: 1024,
    filter: (request, response) => request.headers['x-no-compression'] ? false : compressionFilter(request, response),
  }));

  const allowedOrigins = new Set(parseCorsOrigins(config.get<string>('CORS_ORIGINS', '')));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS policy.'), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Session-Token'],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: false,
    validationError: { target: false, value: false },
    transformOptions: { enableImplicitConversion: false },
  }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector), new ResponseEnvelopeInterceptor());
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CPA Plataforma API')
      .setDescription('API NestJS con PostgreSQL, sesiones opacas y controles de producción.')
      .setVersion('2.1.0')
      .addCookieAuth(config.get<string>('SESSION_COOKIE_NAME', 'cpa_session'))
      .addApiKey({ type: 'apiKey', name: 'X-Session-Token', in: 'header' }, 'opaque-session')
      .build();
    SwaggerModule.setup('docs/api', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  const port = getPositiveInteger(config, 'PORT', 3000);
  const host = config.get<string>('HOST', '0.0.0.0');
  const server = await app.listen(port, host);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.requestTimeout = 30000;
  logger.log(`CPA backend listening on ${host}:${port}`);
}

void bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error('Application startup failed.', error instanceof Error ? error.stack : undefined);
  process.exitCode = 1;
});
