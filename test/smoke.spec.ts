import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import request from 'supertest';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { RESOURCES } from '../src/modules/resource-registry';

const demoUtils = require('../scripts/demo-user-utils');

type HttpMethod = 'get' | 'post' | 'put' | 'patch';

type SmokeResult = {
  name: string;
  method: Uppercase<HttpMethod>;
  url: string;
  status: number;
  message?: string;
};

function configureEnvForSmoke(): void {
  demoUtils.loadProjectEnv();

  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.AUTH_REQUIRED = 'true';
  process.env.ENABLE_PUBLIC_SIGNUP = 'false';
  process.env.RATE_LIMIT_MAX = process.env.SMOKE_RATE_LIMIT_MAX || '10000';
  process.env.RATE_LIMIT_WINDOW_MS = process.env.SMOKE_RATE_LIMIT_WINDOW_MS || '900000';
  process.env.SWAGGER_ENABLED = 'false';
  process.env.DB_LOGGING = 'false';
  process.env.SMOKE_DRY_RUN_CRUD_WRITES = process.env.SMOKE_DRY_RUN_CRUD_WRITES || 'true';

  const testUser = demoUtils.getTestUserFromEnv();
  process.env.TEST_USER_EMAIL = testUser.email;
  process.env.TEST_USER_USERNAME = testUser.username;
  process.env.TEST_USER_PASSWORD = testUser.password;
  process.env.TEST_USER_ID = String(testUser.idPersona);
}

function responseLooksLikeMissingRoute(response: { body?: { message?: unknown } }): boolean {
  const message = String(response.body?.message || '').toLowerCase();
  return message.startsWith('cannot get')
    || message.startsWith('cannot post')
    || message.startsWith('cannot put')
    || message.startsWith('cannot patch')
    || message.includes('not found');
}

function expectEndpointWasReached(response: { status: number; body?: { message?: unknown } }, label = 'endpoint'): void {
  const debugMessage = `${label} devolvió ${response.status}: ${JSON.stringify(response.body || {})}`;
  if ([401, 403, 429, 500].includes(response.status) || responseLooksLikeMissingRoute(response)) {
    throw new Error(debugMessage);
  }
}

function sampleIdsFor(resourcePrimaryKeys: string[]): string[] {
  return resourcePrimaryKeys.map((primaryKey, index) => {
    if (primaryKey === 'id_persona') return String(process.env.TEST_USER_ID || 900001);
    if (primaryKey === 'id_rol') return '1';
    if (primaryKey === 'id_permiso') return '1';
    return String(900001 + index);
  });
}

async function configureApp(app: INestApplication): Promise<void> {
  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api'));
  app.use(cookieParser());
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression({ level: 6, threshold: 1024 }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector), new ResponseEnvelopeInterceptor());
}

describe('CPA Plataforma NestJS - smoke E2E de endpoints', () => {
  let app: INestApplication;
  let agent: any;
  let sessionToken: string;
  const results: SmokeResult[] = [];

  beforeAll(async () => {
    configureEnvForSmoke();
    await demoUtils.seedDemoUser();

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await configureApp(app);
    await app.init();
    agent = request.agent(app.getHttpServer());
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();

    if (process.env.SMOKE_PRINT_SUMMARY === 'true') {
      // eslint-disable-next-line no-console
      console.table(results);
    }
  });

  it('valida health público', async () => {
    const response = await agent.get('/api/health');
    results.push({ name: 'health', method: 'GET', url: '/api/health', status: response.status, message: response.body?.message });
    expect(response.status).toBe(200);
    expect(response.body?.success).toBe(true);
  });

  it('prepara el usuario admin demo desde env y bloquea el signup público', async () => {
    const testUser = demoUtils.getTestUserFromEnv();

    expect(testUser.email).toBeTruthy();
    expect(testUser.username).toBeTruthy();
    expect(testUser.password).toBeTruthy();

    const response = await agent
      .post('/api/auth/publicAuth/signup')
      .send({ id_persona: String(testUser.idPersona), nombre_usuario: testUser.username, password: testUser.password });

    results.push({ name: 'signup público bloqueado', method: 'POST', url: '/api/auth/publicAuth/signup', status: response.status, message: response.body?.message });
    expect(response.status).toBe(403);
  });

  it('hace login real con el admin demo y obtiene sessionToken', async () => {
    const testUser = demoUtils.getTestUserFromEnv();

    const response = await agent
      .post('/api/auth/publicAuth/login')
      .send({ email: testUser.email, password: testUser.password });

    results.push({ name: 'login admin demo', method: 'POST', url: '/api/auth/publicAuth/login', status: response.status, message: response.body?.message });
    expect(response.status).toBe(201);
    expect(response.body?.success).toBe(true);
    expect(response.body?.data?.user?.email).toBe(testUser.email);
    expect(response.body?.data?.user?.es_super_usuario).toBe(true);
    expect(response.body?.data?.sessionToken).toEqual(expect.any(String));

    sessionToken = response.body.data.sessionToken;
  });

  it('valida endpoints privados de auth con la sesión del admin demo', async () => {
    expect(sessionToken).toBeTruthy();

    const privateAuthRequests: Array<{ name: string; method: HttpMethod; url: string }> = [
      { name: 'me GET', method: 'get', url: '/api/auth/privateAuth/me' },
      { name: 'me POST', method: 'post', url: '/api/auth/privateAuth/me' },
      { name: 'refresh-session', method: 'post', url: '/api/auth/privateAuth/refresh-session' },
      { name: 'refreshSession alias', method: 'post', url: '/api/auth/privateAuth/refreshSession' },
    ];

    for (const item of privateAuthRequests) {
      const response = await agent[item.method](item.url).set('X-Session-Token', sessionToken).send({});
      results.push({ name: item.name, method: item.method.toUpperCase() as Uppercase<HttpMethod>, url: item.url, status: response.status, message: response.body?.message });
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
      expect(response.body?.success).toBe(true);
    }
  });

  it.each(RESOURCES)('valida endpoints CRUD de $routeModule/$routePath', async (resource) => {
    expect(sessionToken).toBeTruthy();

    const baseUrl = `/api/${resource.routeModule}/${resource.routePath}`;
    const ids = sampleIdsFor(resource.primaryKeys);
    const idUrl = `${baseUrl}/${ids.map(encodeURIComponent).join('/')}`;

    const listResponse = await agent
      .get(baseUrl)
      .set('X-Session-Token', sessionToken)
      .query({ limit: 1, orderDir: 'ASC' });
    results.push({ name: `${resource.key} list`, method: 'GET', url: baseUrl, status: listResponse.status, message: listResponse.body?.message });
    expectEndpointWasReached(listResponse, `${resource.key} GET list`);
    expect(listResponse.status).toBe(200);

    const getResponse = await agent.get(idUrl).set('X-Session-Token', sessionToken);
    results.push({ name: `${resource.key} get`, method: 'GET', url: idUrl, status: getResponse.status, message: getResponse.body?.message });
    expectEndpointWasReached(getResponse, `${resource.key} GET by id`);
    expect([200, 404]).toContain(getResponse.status);

    const createResponse = await agent.post(baseUrl).set('X-Session-Token', sessionToken).send({});
    results.push({ name: `${resource.key} create`, method: 'POST', url: baseUrl, status: createResponse.status, message: createResponse.body?.message });
    expectEndpointWasReached(createResponse, `${resource.key} POST create`);
    expect([200, 201, 400, 409]).toContain(createResponse.status);

    const updateResponse = await agent.put(idUrl).set('X-Session-Token', sessionToken).send({});
    results.push({ name: `${resource.key} update`, method: 'PUT', url: idUrl, status: updateResponse.status, message: updateResponse.body?.message });
    expectEndpointWasReached(updateResponse, `${resource.key} PUT update`);
    expect([200, 400, 404, 409]).toContain(updateResponse.status);

    const patchResponse = await agent.patch(idUrl).set('X-Session-Token', sessionToken).send({});
    results.push({ name: `${resource.key} patch`, method: 'PATCH', url: idUrl, status: patchResponse.status, message: patchResponse.body?.message });
    expectEndpointWasReached(patchResponse, `${resource.key} PATCH update`);
    expect([200, 400, 404, 409]).toContain(patchResponse.status);
  }, 30000);

  it('cierra sesión al final del recorrido', async () => {
    expect(sessionToken).toBeTruthy();

    const response = await agent
      .post('/api/auth/privateAuth/logout')
      .set('X-Session-Token', sessionToken)
      .send({});

    results.push({ name: 'logout', method: 'POST', url: '/api/auth/privateAuth/logout', status: response.status, message: response.body?.message });
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    expect(response.body?.success).toBe(true);
  });
});
