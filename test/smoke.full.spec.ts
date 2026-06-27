import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { RESOURCES } from '../src/modules/resource-registry';

const demoUtils = require('../scripts/demo-user-utils');

type HttpMethod = 'get' | 'post' | 'put' | 'patch';

type CriticalRoute = {
  name: string;
  url: string;
  minRows?: number;
};

function configureEnvForSmokeFull(): void {
  demoUtils.loadProjectEnv();
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.AUTH_REQUIRED = 'true';
  process.env.ENABLE_PUBLIC_SIGNUP = 'false';
  process.env.RATE_LIMIT_MAX = process.env.SMOKE_RATE_LIMIT_MAX || '10000';
  process.env.RATE_LIMIT_WINDOW_MS = process.env.SMOKE_RATE_LIMIT_WINDOW_MS || '900000';
  process.env.SWAGGER_ENABLED = 'false';
  process.env.DB_LOGGING = 'false';
  process.env.SMOKE_DRY_RUN_CRUD_WRITES = 'false';
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

function expectReached(response: SupertestResponse, label: string): void {
  const message = String(response.body?.message || '').toLowerCase();
  const missingRoute = message.startsWith('cannot get')
    || message.startsWith('cannot post')
    || message.startsWith('cannot put')
    || message.startsWith('cannot patch')
    || message.includes('recurso no encontrado')
    || message.includes('not found');
  if ([401, 403, 429, 500].includes(response.status) || missingRoute) {
    throw new Error(`${label} devolvió ${response.status}: ${JSON.stringify(response.body)}`);
  }
}

function unwrapRows(body: any): unknown[] {
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.rows)) return body.rows;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.records)) return body.records;
  if (Array.isArray(body?.data?.rows)) return body.data.rows;
  return [];
}

async function tableExists(dataSource: DataSource, schema: string, tableName: string): Promise<boolean> {
  const rows = await dataSource.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = $1 AND table_name = $2
     ) AS exists`,
    [schema, tableName],
  ) as Array<{ exists: boolean }>;
  return Boolean(rows[0]?.exists);
}


async function cleanupSmokeFullData(dataSource: DataSource): Promise<void> {
  await dataSource.query(`DELETE FROM contabilidad.venta_clase_registro WHERE estudiante_texto LIKE 'SMOKE FULL%' OR tutor_texto LIKE 'SMOKE FULL%'`).catch(() => undefined);
  await dataSource.query(`
    DELETE FROM contabilidad.cuenta_asignacion
     WHERE id_persona_estudiante IN (
       SELECT id_persona FROM persona.persona WHERE nombres = 'SMOKE FULL' AND email LIKE 'smoke.%@cpa.com'
     )
        OR id_persona_tutor IN (
          SELECT t.id_tutor
            FROM persona.persona_tutor t
            JOIN persona.persona p ON p.id_persona = t.id_persona
           WHERE p.nombres = 'SMOKE FULL' AND p.email LIKE 'smoke.%@cpa.com'
        )
  `).catch(() => undefined);
  await dataSource.query(`
    DELETE FROM persona.persona_tutor
     WHERE id_persona IN (SELECT id_persona FROM persona.persona WHERE nombres = 'SMOKE FULL' AND email LIKE 'smoke.%@cpa.com')
  `).catch(() => undefined);
  await dataSource.query(`
    DELETE FROM persona.persona_estudiante
     WHERE id_persona IN (SELECT id_persona FROM persona.persona WHERE nombres = 'SMOKE FULL' AND email LIKE 'smoke.%@cpa.com')
  `).catch(() => undefined);
  await dataSource.query(`DELETE FROM persona.persona WHERE nombres = 'SMOKE FULL' AND email LIKE 'smoke.%@cpa.com'`).catch(() => undefined);
}

describe('CPA Plataforma - smoke FULL sistema interno', () => {
  let app: INestApplication;
  let agent: any;
  let dataSource: DataSource;
  let sessionToken: string;
  const smokeRunId = 900000000 + Math.floor(Date.now() % 10000000) * 10;
  const smokeEstudianteId = smokeRunId + 1;
  const smokeTutorPersonaId = smokeRunId + 2;

  beforeAll(async () => {
    configureEnvForSmokeFull();
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await configureApp(app);
    await app.init();
    agent = request.agent(app.getHttpServer());
    dataSource = app.get(DataSource);
  }, 90000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await cleanupSmokeFullData(dataSource);
    }
    if (app) await app.close();
  });

  it('levanta health y bloquea signup público', async () => {
    const health = await agent.get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body?.success).toBe(true);

    const signup = await agent.post('/api/auth/publicAuth/signup').send({ id_persona: '123', nombre_usuario: 'smoke.public.signup', password: 'SmokePublicSignup2026!' });
    expect([400, 403]).toContain(signup.status);
    expect(signup.status).not.toBe(201);
  });

  it('hace login por email real @cpa.com y por nombre_usuario', async () => {
    const emailLogin = await agent.post('/api/auth/publicAuth/login').send({ email: 'pablo.admin@cpa.com', password: 'PabloAdmin2026!' });
    expectReached(emailLogin, 'login email pablo');
    expect(emailLogin.status).toBe(201);
    expect(emailLogin.body?.data?.sessionToken).toEqual(expect.any(String));
    sessionToken = emailLogin.body.data.sessionToken;

    const usernameLogin = await agent.post('/api/auth/publicAuth/login').send({ nombre_usuario: 'pablo.admin', password: 'PabloAdmin2026!' });
    expectReached(usernameLogin, 'login usuario pablo');
    expect(usernameLogin.status).toBe(201);
    expect(usernameLogin.body?.data?.sessionToken).toEqual(expect.any(String));
  });

  it('valida usuarios reales seed, roles y emails sin .test', async () => {
    const rows = await dataSource.query(
      `SELECT p.email, u.nombre_usuario, u.es_super_usuario
         FROM persona.persona p
         JOIN persona.persona_usuario u ON u.id_persona = p.id_persona
        WHERE u.nombre_usuario IN ('pablo.admin', 'maria.contador', 'katia.admin')
        ORDER BY u.nombre_usuario`,
    ) as Array<{ email: string; nombre_usuario: string; es_super_usuario: boolean }>;
    expect(rows.map((row) => row.nombre_usuario).sort()).toEqual(['katia.admin', 'maria.contador', 'pablo.admin']);
    for (const row of rows) {
      expect(row.email).toMatch(/@cpa\.com$/);
      expect(row.email).not.toContain('.test');
    }
  });

  it('valida que todos los recursos registrados tienen tabla física y endpoint list', async () => {
    expect(sessionToken).toBeTruthy();
    for (const resource of RESOURCES) {
      await expect(tableExists(dataSource, resource.schema, resource.tableName)).resolves.toBe(true);
      const response = await agent
        .get(`/api/${resource.routeModule}/${resource.routePath}`)
        .set('X-Session-Token', sessionToken)
        .query({ limit: 2, orderDir: 'ASC' });
      expectReached(response, `${resource.key} list`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body?.data)).toBe(true);
    }
  }, 120000);

  it('valida batch genérico y compatibilidad frontend batch/validate para todos los recursos', async () => {
    expect(sessionToken).toBeTruthy();
    for (const resource of RESOURCES) {
      const baseUrl = `/api/${resource.routeModule}/${resource.routePath}`;

      const validateResponse = await agent
        .post(`${baseUrl}/batch/validate`)
        .set('X-Session-Token', sessionToken)
        .send({ mode: 'create', items: [{}] });
      expectReached(validateResponse, `${resource.key} batch validate`);
      expect([201, 400]).toContain(validateResponse.status);
      if (validateResponse.status === 201) {
        expect(validateResponse.body?.success).toBe(true);
        expect(validateResponse.body?.data?.totalRows).toBe(1);
      } else {
        expect(validateResponse.body?.success).toBe(false);
      }

      const batchResponse = await agent
        .post(`${baseUrl}/batch`)
        .set('X-Session-Token', sessionToken)
        .send({ items: [] });
      expectReached(batchResponse, `${resource.key} batch endpoint`);
      expect([400, 201]).toContain(batchResponse.status);
    }
  }, 120000);

  it('valida endpoints críticos consumidos por el frontend actual', async () => {
    const criticalRoutes: CriticalRoute[] = [
      { name: 'aulas alias', url: '/api/infraestructura/aula' },
      { name: 'espacios', url: '/api/infraestructura/espacio' },
      { name: 'materia tree', url: '/api/servicios_educativos/materia-tree', minRows: 20 },
      { name: 'unidades educativas', url: '/api/personas/unidad-educativa', minRows: 20 },
      { name: 'productos educativos', url: '/api/servicios_educativos/producto-educativo', minRows: 10 },
      { name: 'config cuentas operativas', url: '/api/contabilidad/configuracion-cuenta-operativa' },
      { name: 'venta clase registro', url: '/api/contabilidad/venta-clase-registro' },
      { name: 'cuentas', url: '/api/contabilidad/cuenta', minRows: 20 },
    ];

    for (const route of criticalRoutes) {
      const response = await agent.get(route.url).set('X-Session-Token', sessionToken).query({ limit: 50, orderDir: 'ASC' });
      expectReached(response, route.name);
      expect(response.status).toBe(200);
      const rows = unwrapRows(response.body);
      expect(Array.isArray(rows)).toBe(true);
      if (route.minRows) expect(rows.length).toBeGreaterThanOrEqual(Math.min(route.minRows, 50));
    }
  }, 60000);

  it('valida seeds académicos mínimos y configuración contable operativa', async () => {
    const checks = await dataSource.query(
      `SELECT
        (SELECT COUNT(*)::int FROM servicios_educativos.materia_tree) AS materia_tree,
        (SELECT COUNT(*)::int FROM persona.unidad_educativa) AS unidad_educativa,
        (SELECT COUNT(*)::int FROM servicios_educativos.producto_educativo) AS producto_educativo,
        (SELECT COUNT(*)::int FROM contabilidad.configuracion_cuenta_operativa WHERE codigo IN ('CANAL_COBRO_EFECTIVO','CANAL_COBRO_QR','INGRESO_CLASE_POR_HORA')) AS cuentas_operativas`,
    ) as Array<{ materia_tree: number; unidad_educativa: number; producto_educativo: number; cuentas_operativas: number }>;
    expect(checks[0].materia_tree).toBeGreaterThanOrEqual(180);
    expect(checks[0].unidad_educativa).toBeGreaterThanOrEqual(90);
    expect(checks[0].producto_educativo).toBeGreaterThanOrEqual(30);
    expect(checks[0].cuentas_operativas).toBeGreaterThanOrEqual(3);
  });

  it('valida creación estudiante/tutor y generación automática de cuentas asociadas', async () => {
    await cleanupSmokeFullData(dataSource);
    await dataSource.query(
      `INSERT INTO persona.persona (id_persona, nombres, apellidos, telefono, email, estado_registro)
       VALUES
       ($1, 'SMOKE FULL', 'ESTUDIANTE', '70000001', $2, 'Activo'),
       ($3, 'SMOKE FULL', 'TUTOR', '70000002', $4, 'Activo')`,
      [smokeEstudianteId, `smoke.estudiante.${smokeRunId}@cpa.com`, smokeTutorPersonaId, `smoke.tutor.${smokeRunId}@cpa.com`],
    );

    const estudiante = await agent.post('/api/personas/estudiante')
      .set('X-Session-Token', sessionToken)
      .send({ id_persona: smokeEstudianteId, tipo: 'COLEGIAL', nivel_actual: 'SECUNDARIA', curso_actual: 'SEXTO', turno_actual: 'MAÑANA' });
    expectReached(estudiante, 'crear estudiante smoke');
    expect([201, 200]).toContain(estudiante.status);

    const tutor = await agent.post('/api/personas/tutor')
      .set('X-Session-Token', sessionToken)
      .send({ id_persona: smokeTutorPersonaId, pago_por_hora: 45, nivel_experiencia: 'SENIOR', tipo_estudiante_especialidad: 'COLEGIAL', nivel_estudiante_especialidad: 'SECUNDARIA' });
    expectReached(tutor, 'crear tutor smoke');
    expect([201, 200]).toContain(tutor.status);

    const rows = await dataSource.query(
      `SELECT entidad_tipo, COUNT(*)::int AS count
         FROM contabilidad.cuenta_asignacion
        WHERE (id_persona_estudiante = $1 OR id_persona_tutor = $2)
          AND entidad_tipo IN ('ESTUDIANTE_CXC','ESTUDIANTE_PAQUETE_DIFERIDO','TUTOR_CXP')
        GROUP BY entidad_tipo`,
      [smokeEstudianteId, Number(tutor.body?.data?.id_tutor)],
    ) as Array<{ entidad_tipo: string; count: number }>;
    const map = Object.fromEntries(rows.map((row) => [row.entidad_tipo, row.count]));
    expect(map.ESTUDIANTE_CXC).toBeGreaterThanOrEqual(1);
    expect(map.ESTUDIANTE_PAQUETE_DIFERIDO).toBeGreaterThanOrEqual(1);
    expect(map.TUTOR_CXP).toBeGreaterThanOrEqual(1);
  }, 60000);

  it('valida flujo completo venta-clase: clase + venta + detalle + asiento balanceado', async () => {
    const tutorRows = await dataSource.query(`SELECT id_tutor FROM persona.persona_tutor WHERE id_persona = $1 LIMIT 1`, [smokeTutorPersonaId]) as Array<{ id_tutor: number }>;
    const materiaRows = await dataSource.query(`SELECT id_tree FROM servicios_educativos.materia_tree ORDER BY id_tree LIMIT 1`) as Array<{ id_tree: number }>;
    const productoRows = await dataSource.query(`SELECT id_producto_educativo FROM servicios_educativos.producto_educativo ORDER BY id_producto_educativo LIMIT 1`) as Array<{ id_producto_educativo: number }>;
    const suffix = Date.now();
    const sucursalRows = await dataSource.query(
      `INSERT INTO infraestructura.sucursal (codigo, nombre, estado_registro)
       VALUES ($1, 'Sucursal Smoke Full', 'Activo')
       RETURNING id_sucursal`,
      [`SMOKE-FULL-SUC-${suffix}`],
    ) as Array<{ id_sucursal: number }>;
    const edificioRows = await dataSource.query(
      `INSERT INTO infraestructura.edificio (id_sucursal, codigo, nombre, estado_registro)
       VALUES ($1, $2, 'Edificio Smoke Full', 'Activo')
       RETURNING id_edificio`,
      [sucursalRows[0].id_sucursal, `SMOKE-FULL-EDI-${suffix}`],
    ) as Array<{ id_edificio: number }>;
    const aula = await agent.post('/api/infraestructura/aula')
      .set('X-Session-Token', sessionToken)
      .send({ id_edificio: edificioRows[0].id_edificio, tipo_aula: 'TEORIA', nombre: 'Aula Smoke Full', capacidad: 10 });
    expectReached(aula, 'crear aula alias');
    expect([201, 200]).toContain(aula.status);

    const response = await agent.post('/api/contabilidad/venta-clase/registrar-batch')
      .set('X-Session-Token', sessionToken)
      .send({
        fecha: '2026-06-25',
        items: [{
          hora_ingreso: '08:00',
          hora_salida: '09:00',
          id_estudiante: smokeEstudianteId,
          nombre_estudiante: 'SMOKE FULL ESTUDIANTE',
          id_tutor: Number(tutorRows[0].id_tutor),
          nombre_tutor: 'SMOKE FULL TUTOR',
          id_aula: Number(aula.body?.data?.id_espacio),
          id_materia_tree: Number(materiaRows[0].id_tree),
          id_producto_educativo: Number(productoRows[0].id_producto_educativo),
          materia: 'Matemáticas',
          tema: 'Smoke',
          subtema: 'Smoke',
          motivo_clase: 'NIVELACIÓN',
          efectivo: 50,
          qr: 20,
          cxc: 30,
          paquete: 0,
          precio_unitario: 100,
          cantidad: 1,
          situacion_base: 'SMOKE_FULL',
        }],
      });
    expectReached(response, 'venta clase batch');
    expect(response.status).toBe(201);
    expect(response.body?.success).toBe(true);
    expect(response.body?.data?.count).toBe(1);

    const registro = response.body.data.registros[0];
    expect(registro.transaccion?.tipo_transaccion).toBe('VENTA');
    expect(Number(registro.totales?.debe)).toBeCloseTo(Number(registro.totales?.haber), 2);
    expect(registro.detalle_venta).toBeTruthy();
    expect(registro.venta_clase_registro).toBeTruthy();
  }, 60000);

  it('cierra sesión', async () => {
    const response = await agent.post('/api/auth/privateAuth/logout').set('X-Session-Token', sessionToken).send({});
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    expect(response.body?.success).toBe(true);
  });
});
