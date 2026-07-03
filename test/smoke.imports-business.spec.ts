import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import request from 'supertest';
import * as XLSX from 'xlsx';
import type { Response as SupertestResponse } from 'supertest';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';

const officialUtils = require('../scripts/official-user-utils');

function configureEnvForSmokeImports(): void {
  officialUtils.loadProjectEnv();
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

function xlsxBuffer(rows: Record<string, unknown>[]): Buffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Import');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('CPA Plataforma - smoke importaciones masivas y errores de negocio', () => {
  let app: INestApplication;
  let agent: any;
  let dataSource: DataSource;
  let sessionToken: string;

  beforeAll(async () => {
    configureEnvForSmokeImports();
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await configureApp(app);
    await app.init();
    agent = request.agent(app.getHttpServer());
    dataSource = app.get(DataSource);

    const login = await agent
      .post('/api/auth/publicAuth/login')
      .send({ email: 'pablo.admin@cpa.com', password: 'PabloAdmin2026!' });
    expect(login.status).toBe(201);
    sessionToken = login.body?.data?.sessionToken;
    expect(sessionToken).toEqual(expect.any(String));
  }, 90000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(`DELETE FROM persona.unidad_educativa WHERE nombre LIKE 'SMOKE IMPORT %'`).catch(() => undefined);
      await dataSource.query(`DELETE FROM contabilidad.archivo_transaccion at USING contabilidad.archivo a WHERE at.id_archivo = a.id_archivo AND a.url_archivo LIKE 'https://smoke.cpa/%'`).catch(() => undefined);
      await dataSource.query(`DELETE FROM contabilidad.archivo WHERE url_archivo LIKE 'https://smoke.cpa/%'`).catch(() => undefined);
      await dataSource.query(`DELETE FROM administracion.registro_borrador WHERE clave_cliente LIKE 'smoke-draft-%'`).catch(() => undefined);
      await dataSource.query(`DELETE FROM contabilidad.venta_clase_registro WHERE estudiante_texto LIKE 'SMOKE ERROR%' OR tutor_texto LIKE 'SMOKE ERROR%'`).catch(() => undefined);
    }
    if (app) await app.close();
  });

  it('valida y procesa carga masiva JSON para unidad educativa', async () => {
    const items = [
      { nombre: 'SMOKE IMPORT JSON 1', categoria: 'privada' },
      { nombre: 'SMOKE IMPORT JSON 2', categoria: 'privada' },
    ];

    const validate = await agent
      .post('/api/personas/unidad-educativa/batch/validate')
      .set('X-Session-Token', sessionToken)
      .send({ mode: 'create', items });
    expectReached(validate, 'JSON batch validate unidad educativa');
    expect(validate.status).toBe(201);
    expect(validate.body?.data?.totalRows).toBe(2);
    expect(validate.body?.data?.errorRows).toBe(0);

    const process = await agent
      .post('/api/personas/unidad-educativa/batch/process')
      .set('X-Session-Token', sessionToken)
      .send({ mode: 'create', items });
    expectReached(process, 'JSON batch process unidad educativa');
    expect(process.status).toBe(201);
    expect(Array.isArray(process.body?.data)).toBe(true);
    expect(process.body?.count).toBe(2);
  });

  it('valida y procesa carga masiva CSV para unidad educativa', async () => {
    const csv = Buffer.from('nombre,categoria\nSMOKE IMPORT CSV 1,privada\nSMOKE IMPORT CSV 2,privada\n', 'utf8');

    const validate = await agent
      .post('/api/personas/unidad-educativa/batch/validate')
      .set('X-Session-Token', sessionToken)
      .field('mode', 'create')
      .attach('file', csv, { filename: 'unidad_educativa.csv', contentType: 'text/csv' });
    expectReached(validate, 'CSV batch validate unidad educativa');
    expect(validate.status).toBe(201);
    expect(validate.body?.data?.totalRows).toBe(2);
    expect(validate.body?.data?.errorRows).toBe(0);

    const process = await agent
      .post('/api/personas/unidad-educativa/batch/process')
      .set('X-Session-Token', sessionToken)
      .field('mode', 'create')
      .attach('file', csv, { filename: 'unidad_educativa.csv', contentType: 'text/csv' });
    expectReached(process, 'CSV batch process unidad educativa');
    expect(process.status).toBe(201);
    expect(process.body?.count).toBe(2);
  });

  it('valida y procesa carga masiva Excel .xlsx para unidad educativa', async () => {
    const file = xlsxBuffer([
      { nombre: 'SMOKE IMPORT XLSX 1', categoria: 'privada' },
      { nombre: 'SMOKE IMPORT XLSX 2', categoria: 'privada' },
    ]);

    const validate = await agent
      .post('/api/personas/unidad-educativa/batch/validate')
      .set('X-Session-Token', sessionToken)
      .field('mode', 'create')
      .attach('file', file, { filename: 'unidad_educativa.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    expectReached(validate, 'XLSX batch validate unidad educativa');
    expect(validate.status).toBe(201);
    expect(validate.body?.data?.totalRows).toBe(2);
    expect(validate.body?.data?.errorRows).toBe(0);

    const process = await agent
      .post('/api/personas/unidad-educativa/batch/process')
      .set('X-Session-Token', sessionToken)
      .field('mode', 'create')
      .attach('file', file, { filename: 'unidad_educativa.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    expectReached(process, 'XLSX batch process unidad educativa');
    expect(process.status).toBe(201);
    expect(process.body?.count).toBe(2);
  });

  it('detecta errores de validación en importación antes de procesar', async () => {
    const validate = await agent
      .post('/api/personas/unidad-educativa/batch/validate')
      .set('X-Session-Token', sessionToken)
      .send({ mode: 'create', items: [{ columna_inexistente: 'x' }] });
    expectReached(validate, 'batch validate con columnas inválidas');
    expect(validate.status).toBe(201);
    expect(validate.body?.data?.errorRows).toBe(1);
    expect(validate.body?.data?.errors?.[0]?.message).toContain('columnas válidas');

    const process = await agent
      .post('/api/personas/unidad-educativa/batch/process')
      .set('X-Session-Token', sessionToken)
      .send({ mode: 'create', items: [{ columna_inexistente: 'x' }] });
    expect(process.status).toBe(400);
    expect(String(process.body?.message || '').toLowerCase()).toContain('error');
  });


  it('crea borradores, archivos independientes y archivo-transaccion en una operación', async () => {
    const draft = await agent
      .post('/api/administracion/registro-borrador')
      .set('X-Session-Token', sessionToken)
      .send({
        modulo: 'personas',
        recurso: 'estudiante',
        operacion: 'create',
        titulo: 'SMOKE BORRADOR ESTUDIANTE',
        payload_json: { nombres: 'Smoke', apellidos: 'Draft' },
        estado_borrador: 'BORRADOR',
        clave_cliente: `smoke-draft-${Date.now()}`,
      });
    expectReached(draft, 'crear registro borrador');
    expect(draft.status).toBe(201);
    expect(draft.body?.data?.id_borrador).toBeTruthy();

    const standaloneFile = await agent
      .post('/api/contabilidad/archivo/registrar')
      .set('X-Session-Token', sessionToken)
      .send({
        url_archivo: `https://smoke.cpa/standalone-${Date.now()}.pdf`,
        nombre_archivo: 'standalone.pdf',
        tipo_mime: 'application/pdf',
        tamano_bytes: 128,
      });
    expectReached(standaloneFile, 'crear archivo independiente');
    expect(standaloneFile.status).toBe(201);
    expect(standaloneFile.body?.data?.id_archivo).toBeTruthy();

    const cuentaRows = await dataSource.query(
      `SELECT id_cuenta FROM contabilidad.cuenta WHERE codigo IN ('1.1.01.001', '4.1.01.001') ORDER BY codigo`,
    ) as Array<{ id_cuenta: number }>;
    expect(cuentaRows.length).toBeGreaterThanOrEqual(2);

    const transaccion = await agent
      .post('/api/contabilidad/transaccion/con-movimientos')
      .set('X-Session-Token', sessionToken)
      .send({
        transaccion: { tipo_transaccion: 'GENERAL', glosa: 'SMOKE ARCHIVO TRANSACCION' },
        movimientos: [
          { id_cuenta: cuentaRows[0].id_cuenta, debe: 100, haber: 0 },
          { id_cuenta: cuentaRows[1].id_cuenta, debe: 0, haber: 100 },
        ],
      });
    expectReached(transaccion, 'crear transaccion para archivo');
    expect(transaccion.status).toBe(201);
    const idTransaccion = transaccion.body?.data?.transaccion?.id_transaccion || transaccion.body?.data?.id_transaccion;
    expect(idTransaccion).toBeTruthy();

    const archivoTransaccion = await agent
      .post('/api/contabilidad/archivo-transaccion/registrar')
      .set('X-Session-Token', sessionToken)
      .send({
        id_transaccion: idTransaccion,
        tipo_asociacion: 'SOPORTE',
        archivo: {
          url_archivo: `https://smoke.cpa/linked-${Date.now()}.pdf`,
          nombre_archivo: 'linked.pdf',
          tipo_mime: 'application/pdf',
          tamano_bytes: 256,
        },
      });
    expectReached(archivoTransaccion, 'crear archivo y asociacion');
    expect(archivoTransaccion.status).toBe(201);
    expect(archivoTransaccion.body?.data?.archivo?.id_archivo).toBeTruthy();
    expect(archivoTransaccion.body?.data?.archivoTransaccion?.id_archivo_transaccion).toBeTruthy();
  });

  it('rechaza errores de negocio en venta-clase: CxC sin estudiante, clase incompleta, fiscal y montos negativos', async () => {
    const cxcSinEstudiante = await agent
      .post('/api/contabilidad/venta-clase/registrar-batch')
      .set('X-Session-Token', sessionToken)
      .send({
        fecha: '2026-06-25',
        items: [{ estudiante_texto: 'SMOKE ERROR SIN ID', materia: 'Matemáticas', cxc: 50 }],
      });
    expect(cxcSinEstudiante.status).toBe(400);
    expect(String(cxcSinEstudiante.body?.message || '').toLowerCase()).toContain('id_estudiante');

    const descuadre = await agent
      .post('/api/contabilidad/venta-clase/registrar-batch')
      .set('X-Session-Token', sessionToken)
      .send({
        fecha: '2026-06-25',
        items: [{ estudiante_texto: 'SMOKE ERROR DESCUADRE', materia: 'Matemáticas', efectivo: 10, precio_unitario: 20, cantidad: 1 }],
      });
    expect(descuadre.status).toBe(400);
    expect(String(descuadre.body?.message || '').toLowerCase()).toContain('faltan datos obligatorios');

    const fiscal = await agent
      .post('/api/contabilidad/venta-clase/registrar-batch')
      .set('X-Session-Token', sessionToken)
      .send({
        fecha: '2026-06-25',
        items: [{ estudiante_texto: 'SMOKE ERROR FISCAL', materia: 'Matemáticas', efectivo: 100, precio_unitario: 100, cantidad: 1, porcentaje_impuesto: 13 }],
      });
    expect(fiscal.status).toBe(400);
    expect(String(fiscal.body?.message || '').toLowerCase()).toContain('no usa iva');

    const negativo = await agent
      .post('/api/contabilidad/venta-clase/registrar-batch')
      .set('X-Session-Token', sessionToken)
      .send({
        fecha: '2026-06-25',
        items: [{ estudiante_texto: 'SMOKE ERROR NEGATIVO', materia: 'Matemáticas', efectivo: -1 }],
      });
    expect(negativo.status).toBe(400);
    expect(String(negativo.body?.message || '').toLowerCase()).toContain('negativo');
  });

  it('rechaza asiento contable desbalanceado', async () => {
    const cuentaRows = await dataSource.query(
      `SELECT id_cuenta FROM contabilidad.cuenta WHERE codigo IN ('1.1.01.001', '4.1.01.001') ORDER BY codigo`,
    ) as Array<{ id_cuenta: number }>;
    expect(cuentaRows.length).toBeGreaterThanOrEqual(2);

    const response = await agent
      .post('/api/contabilidad/transaccion/con-movimientos')
      .set('X-Session-Token', sessionToken)
      .send({
        transaccion: { tipo_transaccion: 'GENERAL', glosa: 'SMOKE ERROR ASIENTO DESBALANCEADO' },
        movimientos: [
          { id_cuenta: cuentaRows[0].id_cuenta, debe: 100, haber: 0 },
          { id_cuenta: cuentaRows[1].id_cuenta, debe: 0, haber: 90 },
        ],
      });
    expect(response.status).toBe(400);
    expect(String(response.body?.message || '').toLowerCase()).toContain('balance');
  });

  it('rechaza duplicados de negocio por constraint único en importación', async () => {
    const grupoRows = await dataSource.query(
      `SELECT id_grupo_cuenta FROM contabilidad.grupo_cuenta ORDER BY id_grupo_cuenta ASC LIMIT 1`,
    ) as Array<{ id_grupo_cuenta: number }>;
    expect(grupoRows[0]?.id_grupo_cuenta).toBeTruthy();

    const response = await agent
      .post('/api/contabilidad/cuenta/batch/process')
      .set('X-Session-Token', sessionToken)
      .send({
        mode: 'create',
        items: [{ codigo: '1.1.01.001', nombre_cuenta: 'SMOKE DUPLICADO CUENTA', id_grupo_cuenta: grupoRows[0].id_grupo_cuenta }],
      });
    expect([400, 409]).toContain(response.status);
    expect(String(response.body?.message || '').toLowerCase()).toMatch(/duplic|unique|existe|conflict/);
  });
});
