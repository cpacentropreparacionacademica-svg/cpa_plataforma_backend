# Graph Report - cpa_plataforma_backend  (2026-08-03)

## Corpus Check
- 215 files · ~332,275 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1923 nodes · 3322 edges · 150 communities (118 shown, 32 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `17ee7643`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 001_create_database_schema.sql
- ddl.sql
- ContabilidadAccountingService
- auth.service.js
- deuda.controller.js
- auth.controller.js
- PersonasLifecycleService
- app.module.ts
- OpaqueSessionService
- Prompt final especializado para backend con NestJS, TypeScript, Zod, JWT y Sequelize
- dependencies
- PasswordHasherService
- devDependencies
- persona.persona
- Lineamientos de programación profesional para código en producción
- AuthService
- scripts
- ResourceConfig
- posicion.controller.js
- concepto_costo.controller.js
- cuenta.controller.js
- grupo_cuenta.controller.js
- pago_tutor.controller.js
- transaccion.controller.js
- asistencia_clase_curso.controller.js
- clase_curso.controller.js
- horarios.controller.js
- AuthRepository
- AdministracionLifecycleService
- HealthController
- AdministracionController
- RedisRateLimitGuard
- InfraestructuraController
- InventarioController
- SeguridadController
- Endpoint especializado: Parte de clases pasadas a venta contable
- Contrato frontend - Parte de clases pasadas / Venta de clase
- departamento.controller.js
- compilerOptions
- redis-rate-limit.guard.ts
- toHttpDatabaseException
- Contrato frontend - Parte de clases pasadas / Venta de clase
- persona_usuario.controller.js
- ReporteriaContabilidadService
- titular.controller.js
- backup-postgres.js
- zText
- Prompt maestro ajustado para centro de clases personalizadas, contabilidad y empleados
- Instrucciones generales de generación del proyecto
- objetivo_kpi.controller.js
- demo-user-utils.js
- official-user-utils.js
- Conciliación Backend ↔ Frontend — Reportería Contable CPA
- Manual de cambios para frontend
- Smoke de importaciones masivas, errores de negocio y backup Render
- Módulos principales del sistema
- ResourceModuleName
- migrate-prod.js
- jest
- tsconfig.build.json
- AuthRepository
- Endpoints mínimos sugeridos
- CPA Plataforma Backend NestJS
- Cobertura principal
- Patch: cuentas operativas configurables y cuentas por estudiante/tutor
- Documentación general ultra detallada - CPA Plataforma Backend
- permission.guard.ts
- Endpoints batch y contabilidad avanzada
- check-source-size.js
- Borradores y archivos independientes
- CPA backend hardening programme
- Guía local rápida: instalación, smoke tests y puerto ocupado
- package.json
- Bootstrap de producción CPA Plataforma
- Qué carga
- Patch contable: detalle de transacción venta y costo
- Financial and accounting control matrix
- Redis en CPA Plataforma Backend
- 8. Separación de responsabilidades
- render-start.js
- seed-reporteria-contable-permissions.js
- Plan de cuentas CPA estandarizado
- Deploy en Render
- FRONTEND_CONTRATO_CPA_ULTRA_DETALLADO.md
- 3. Tabla editable: Parte de clases pasadas
- 4. Catálogos necesarios para la tabla
- DOCUMENTO QUE DEBES PASAR AL FRONTEND
- Seed de permisos para reportería contable
- Auditoría técnica - Reportería contable PowerBI
- Smoke test FULL - CPA Plataforma Backend
- Manejo de estados
- smoke-live.js
- Arquitectura NestJS aplicada
- Fix migración 006 - función de auditoría faltante
- Base de datos
- Fix definitivo de contrato de listados para frontend
- Corrección de listado CRUD para frontend
- 2. Error corregido: aulas
- Accounting production review checklist
- UMLs - Centro de Clases Personalizadas
- Auditoría estricta - borradores y archivos independientes
- Fix Render build: dist/main.js no generado
- render-build.sh
- Reporte de migración Express → NestJS
- Endpoints nuevos: detalle de venta y costo
- 10. Errores comunes y cómo mostrarlos
- 1.1 Login
- 5. Configuración contable de cuentas operativas
- Hardening audit baseline
- Clean-code and naming review
- Production readiness status
- Immediate credential incident response
- PostgreSQL backup and restore verification
- Production deployment runbook
- Flujos principales
- Patch 011: venta-clase sin fiscal, apertura y lifecycle
- Patch 005: venta_clase_registro
- Auth session: permisos reales en respuesta de sesión
- 8. Servicio Axios recomendado
- nest-cli.json
- 6. Cuentas automáticas por estudiante y tutor
- Anexo: borradores y archivos independientes
- International standards traceability
- Stack técnico obligatorio
- 21. Estrategias permitidas para envío de JWT
- 7. Versionado de API
- node-runtime.md
- security.md
- 0001-preserve-typeorm-during-hardening.md
- 0002-language-boundaries.md
- venta-clase-table-contract.md
- README.md
- SMOKE_FULL_REPETIBLE_FIX.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md
- README.md

## God Nodes (most connected - your core abstractions)
1. `CrudService` - 53 edges
2. `Prompt final especializado para backend con NestJS, TypeScript, Zod, JWT y Sequelize` - 46 edges
3. `ContabilidadAccountingService` - 38 edges
4. `scripts` - 33 edges
5. `PersonasLifecycleService` - 28 edges
6. `ContabilidadController` - 27 edges
7. `ResourceConfig` - 27 edges
8. `Lineamientos de programación profesional para código en producción` - 26 edges
9. `PersonasController` - 24 edges
10. `Prompt maestro ajustado para centro de clases personalizadas, contabilidad y empleados` - 24 edges

## Surprising Connections (you probably didn't know these)
- `xlsxBuffer()` --references--> `xlsx`  [EXTRACTED]
  test/smoke.imports-business.spec.ts → package.json
- `seedDemoUser()` --calls--> `assertNotProduction()`  [EXTRACTED]
  scripts/demo-user-utils.js → scripts/seed-security.js
- `seedDemoUser()` --calls--> `hashPassword()`  [EXTRACTED]
  scripts/demo-user-utils.js → scripts/seed-security.js
- `runCleanDemoData()` --calls--> `assertNotProduction()`  [EXTRACTED]
  scripts/demo-user-utils.js → scripts/seed-security.js
- `main()` --calls--> `loadProjectEnv()`  [EXTRACTED]
  scripts/list-migration-checksums.js → scripts/official-user-utils.js

## Import Cycles
- None detected.

## Communities (150 total, 32 thin omitted)

### Community 0 - "001_create_database_schema.sql"
Cohesion: 0.21
Nodes (6): CrudAction, PermissionGuard, RequestWithAuth, Injectable, getResourceConfig(), RESOURCES

### Community 1 - "ddl.sql"
Cohesion: 0.18
Nodes (14): InventarioController, ApiCookieAuth, ApiTags, Body, Controller, Get, Param, Patch (+6 more)

### Community 2 - "ContabilidadAccountingService"
Cohesion: 0.11
Nodes (11): ContabilidadAccountingService, CreateTransaccionConMovimientosBody, MovimientoPayload, NormalizedMovimiento, RevertirAsientoBody, TRANSACCION_INSERT_COLUMNS, TRANSACCION_REVERSAL_COLUMNS, TransaccionPayload (+3 more)

### Community 3 - "auth.service.js"
Cohesion: 0.10
Nodes (18): ArchivoPayload, ContabilidadArchivoService, RegistrarArchivoTransaccionPayload, Injectable, ContabilidadController, ApiCookieAuth, ApiTags, Body (+10 more)

### Community 4 - "deuda.controller.js"
Cohesion: 0.18
Nodes (14): ServiciosEducativosController, ApiCookieAuth, ApiTags, Body, Controller, Get, Param, Patch (+6 more)

### Community 5 - "auth.controller.js"
Cohesion: 0.17
Nodes (11): 12. Checklist de producción, 13. Decisión final, 3. Mapa de procesos contables, 4. Matriz de errores contables, 5. Matriz de problemas técnicos, 7. Catálogo de vistas, 8.1 Contrato de paginación, 8. Catálogo de endpoints (+3 more)

### Community 6 - "PersonasLifecycleService"
Cohesion: 0.10
Nodes (16): PersonasController, ApiCookieAuth, ApiTags, Body, Controller, Get, Param, Patch (+8 more)

### Community 7 - "app.module.ts"
Cohesion: 0.09
Nodes (28): ApiGatewayModule, Module, CommonModule, Module, RequestContextMiddleware, Injectable, AdministracionModule, Module (+20 more)

### Community 8 - "OpaqueSessionService"
Cohesion: 0.24
Nodes (4): OpaqueSessionService, Injectable, generateOpaqueToken(), sha256()

### Community 9 - "Prompt final especializado para backend con NestJS, TypeScript, Zod, JWT y Sequelize"
Cohesion: 0.05
Nodes (43): 0. Regla superior obligatoria sobre backend, 10. Migraciones y seeders, 11. Transacciones con Sequelize, 12. Auditoría estándar de entidades, 13. Repository genérico para CRUD con Sequelize, 14. Service genérico para CRUD: opcional y controlado, 15. Prohibición de controllers genéricos, 16. Validación con Zod (+35 more)

### Community 10 - "dependencies"
Cohesion: 0.05
Nodes (42): class-transformer, class-validator, compression, cookie-parser, dotenv, helmet, ioredis, multer (+34 more)

### Community 11 - "PasswordHasherService"
Cohesion: 0.18
Nodes (7): PermissionService, Injectable, asQueryFailedErrorLike(), DatabaseErrorLike, QueryFailedErrorLike, sanitize(), toHttpDatabaseException()

### Community 12 - "devDependencies"
Cohesion: 0.05
Nodes (41): eslint, @eslint/js, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, devDependencies, eslint (+33 more)

### Community 13 - "persona.persona"
Cohesion: 0.27
Nodes (9): checksum(), { Client }, crypto, fs, loadLegacyChecksums(), { loadProjectEnv }, main(), path (+1 more)

### Community 14 - "Lineamientos de programación profesional para código en producción"
Cohesion: 0.06
Nodes (35): 0. Modo obligatorio: temperatura 0, precisión y cero adivinanzas, 10. Tipado y contratos de datos, 11. Organización de carpetas, 12. Performance y escalabilidad, 13. Integraciones externas, 14. Logs y observabilidad, 15. Código listo para producción, 16. Formato de respuesta esperado (+27 more)

### Community 16 - "scripts"
Cohesion: 0.06
Nodes (33): scripts, audit:dependencies, backup:postgres, build, check, check:source-size, db:clean:official, db:migrate:prod (+25 more)

### Community 17 - "ResourceConfig"
Cohesion: 0.15
Nodes (15): CONTROL_QUERY_FIELDS, CrudRepository, ListResult, PERSONA_JOIN_COLUMNS, PERSONA_METADATA_RESOURCE, PROTECTED_SYSTEM_FIELDS, statusFilterVariants(), toRows() (+7 more)

### Community 18 - "posicion.controller.js"
Cohesion: 0.22
Nodes (4): asegurarTutor(), CONEXION, crearPagoTutor(), HAY_CONFIGURACION

### Community 19 - "concepto_costo.controller.js"
Cohesion: 0.05
Nodes (37): Catch, AppModule, Module, AllExceptionsFilter, CsrfOriginGuard, SAFE_METHODS, Injectable, ResponseEnvelopeInterceptor (+29 more)

### Community 20 - "cuenta.controller.js"
Cohesion: 0.25
Nodes (8): 15. Comandos, Base de datos de desarrollo y pruebas, Instalación, Pruebas contables, Rotación de credenciales heredadas (obligatoria antes de producción), Sembrado del usuario administrador, Variables de entorno, Verificación completa

### Community 21 - "grupo_cuenta.controller.js"
Cohesion: 0.29
Nodes (7): 10.1 Migraciones desde base vacía, 10.2 Pruebas de integridad contable — 30/30, 10.3 Ejecución real de los reportes, 10.4 Verificación de orden de rutas, 10.5 Calidad, 10.6 Reproducibilidad end-to-end, 10. Evidencias

### Community 22 - "pago_tutor.controller.js"
Cohesion: 0.25
Nodes (3): ExtractedSessionToken, OpaqueSessionGuard, Injectable

### Community 23 - "transaccion.controller.js"
Cohesion: 0.23
Nodes (11): { createSecurePgClient, hashPassword }, listLegacyAccounts(), { loadProjectEnv }, main(), rotate(), assertDestructiveOperationAllowed(), assertNotProduction(), { Client } (+3 more)

### Community 25 - "clase_curso.controller.js"
Cohesion: 0.33
Nodes (6): 11.1 Bloqueantes de seguridad — **resueltos**, 11.2 Acción de operación obligatoria antes de producción, 11.3 Integridad contable complementaria — **resuelta**, 11.4 Frontend contable — **resuelto**, 11.5 Funcionalidad contable ausente — requiere desarrollo, no corrección, 11. Riesgos pendientes

### Community 26 - "horarios.controller.js"
Cohesion: 0.33
Nodes (6): 1.1 Estado inicial, 1.2 Errores contables principales corregidos, 1.3 Problemas técnicos principales corregidos, 1.4 Estado final, 1.5 Recomendación de producción, 1. Resumen ejecutivo

### Community 27 - "AuthRepository"
Cohesion: 0.38
Nodes (5): AuthUser, express-serve-static-core, Request, Express, Request

### Community 29 - "HealthController"
Cohesion: 0.33
Nodes (3): HealthController, Controller, Get

### Community 30 - "AdministracionController"
Cohesion: 0.19
Nodes (14): AdministracionController, ApiCookieAuth, ApiTags, Body, Controller, Get, Param, Patch (+6 more)

### Community 32 - "InfraestructuraController"
Cohesion: 0.18
Nodes (14): InfraestructuraController, ApiCookieAuth, ApiTags, Body, Controller, Get, Param, Patch (+6 more)

### Community 33 - "InventarioController"
Cohesion: 0.06
Nodes (30): DeudaController, ApiCookieAuth, ApiTags, Body, Controller, Get, Param, Patch (+22 more)

### Community 34 - "SeguridadController"
Cohesion: 0.18
Nodes (14): SeguridadController, ApiCookieAuth, ApiTags, Body, Controller, Get, Param, Patch (+6 more)

### Community 37 - "Endpoint especializado: Parte de clases pasadas a venta contable"
Cohesion: 0.07
Nodes (26): Actualizar múltiples registros, Archivos independientes, Asociación archivo-transacción, Autenticación privada, Batch genérico por recurso, Borradores, Corrección frontend: alias de aulas, Crear múltiples registros (+18 more)

### Community 38 - "Contrato frontend - Parte de clases pasadas / Venta de clase"
Cohesion: 0.07
Nodes (26): Actualización: cuentas contables por estudiante y configuración manual, Advertencias posibles, Campos alternativos aceptados por backend, Columnas recomendadas para la tabla frontend, Configuración manual de efectivo y QR, Contrato frontend - Parte de clases pasadas / Venta de clase, Creación automática de cuentas, CRUD de trazabilidad para mostrar historial (+18 more)

### Community 39 - "departamento.controller.js"
Cohesion: 0.40
Nodes (5): 14. Archivos creados y modificados, Creados — backend, Creados y modificados — frontend, Eliminados, Modificados — backend

### Community 40 - "compilerOptions"
Cohesion: 0.08
Nodes (25): test/**/*.ts, compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators (+17 more)

### Community 41 - "redis-rate-limit.guard.ts"
Cohesion: 0.23
Nodes (5): InMemoryRateLimitGuard, Injectable, getPositiveInteger(), DatabaseModule, Module

### Community 44 - "toHttpDatabaseException"
Cohesion: 0.40
Nodes (5): 6.1 Hallazgo estructural, 6.2 Matriz pantalla–vista–endpoint, 6.3 Sobrelectura detectada y no corregida, 6.4 Pantallas contables construidas, 6. Inventario frontend

### Community 45 - "Contrato frontend - Parte de clases pasadas / Venta de clase"
Cohesion: 0.09
Nodes (22): Advertencias posibles, Campos alternativos aceptados por backend, Columnas recomendadas para la tabla frontend, Contrato frontend - Parte de clases pasadas / Venta de clase, CRUD de trazabilidad para mostrar historial, Cuenta contable no encontrada, Cuentas contables usadas por defecto, Ejemplo de integración con Axios (+14 more)

### Community 48 - "persona_usuario.controller.js"
Cohesion: 0.40
Nodes (4): arrowParens, printWidth, singleQuote, trailingComma

### Community 49 - "ReporteriaContabilidadService"
Cohesion: 0.12
Nodes (13): CASH_CONFIG_CODES, CuentaReporteria, ReporteriaContabilidadService, ReporteriaContableQuery, Injectable, ReporteriaController, ApiCookieAuth, ApiTags (+5 more)

### Community 50 - "titular.controller.js"
Cohesion: 0.50
Nodes (4): 2.1 Componentes, 2.2 Flujo contable, 2.3 Defensa en profundidad, 2. Arquitectura actual

### Community 51 - "backup-postgres.js"
Cohesion: 0.18
Nodes (21): assertBinaryAvailable(), assertRestoreSafety(), backupSchemas(), dropTargetSchemas(), dumpSchemaArgs(), fs, gunzipToSqlFile(), isTrue() (+13 more)

### Community 55 - "Prompt maestro ajustado para centro de clases personalizadas, contabilidad y empleados"
Cohesion: 0.10
Nodes (20): Adaptación a la estructura existente del proyecto, Arquitectura requerida, Auditoría obligatoria, Contexto del proyecto, Criterio final, Diagramas PlantUML requeridos, Documentación Swagger / OpenAPI, Eventos importantes del dominio (+12 more)

### Community 56 - "Instrucciones generales de generación del proyecto"
Cohesion: 0.10
Nodes (20): 0. Modo de trabajo obligatorio: precisión, temperatura 0 y cero adivinanzas, 10. Workers como procesos persistentes de producción, 1. Lectura obligatoria de prompts base, 2. Lectura y análisis de diagramas del sistema, 3. Criterios de interpretación de los diagramas, 4. Manejo de diagramas faltantes o incompletos, 5. Relación entre diagramas y arquitectura generada, 6. Generación de entregables (+12 more)

### Community 77 - "demo-user-utils.js"
Cohesion: 0.25
Nodes (16): { loadProjectEnv, getTestUserFromEnv, runCleanDemoData }, main(), { assertNotProduction, createSecurePgClient, hashPassword }, cleanDemoData(), createPgClient(), firstEnv(), fs, getTestUserFromEnv() (+8 more)

### Community 78 - "official-user-utils.js"
Cohesion: 0.25
Nodes (16): { loadProjectEnv, getOfficialUserFromEnv, runCleanOfficialUserData }, main(), {
  assertDestructiveOperationAllowed,
  createSecurePgClient,
  hashPassword,
  requireSeedPassword,
}, cleanOfficialUserData(), createPgClient(), firstEnv(), fs, getOfficialUserFromEnv() (+8 more)

### Community 91 - "Conciliación Backend ↔ Frontend — Reportería Contable CPA"
Cohesion: 0.12
Nodes (16): 10. Checklist de conciliación final, 11. Decisión pendiente de negocio, 1. Endpoint único requerido, 2. Por qué el endpoint debe devolver hasta `fechaCorte`, 3. Respuesta oficial esperada, 4. Movimiento esperado por cada fila, 5. SQL recomendado para el endpoint, 6. Ejemplo de implementación NestJS orientativa (+8 more)

### Community 94 - "Manual de cambios para frontend"
Cohesion: 0.12
Nodes (15): 1. Endpoints de creación no fragmentada, 2. Parte de clases pasadas / venta-clase, 3. Impuestos y cuentas fiscales, 4. Descuentos y recargos, 5. Plan de cuentas para frontend, 6. Balance de apertura, 7. Ajustes mínimos esperados en frontend, Alcance (+7 more)

### Community 95 - "Smoke de importaciones masivas, errores de negocio y backup Render"
Cohesion: 0.12
Nodes (15): 1. Nuevo smoke test, 2. Qué prueba exactamente, 3. Comando recomendado para QA completo local, 4. Backup PostgreSQL para Render Cron Job, 5.1 Backup hacia otro host Neon/PostgreSQL, 5.2 Dónde colocar el link/conexión del otro Neon, 5. Variables de entorno para backup, 6. Render Cron Job (+7 more)

### Community 96 - "Módulos principales del sistema"
Cohesion: 0.12
Nodes (16): 10. Servicio Infraestructura, 11. Servicio Inventario, 12. Servicio Seguridad, 13. Servicio Notificaciones, 14. Servicio Auditoría, 15. Servicio Reportes, 1. Servicio Personas, 2. Servicio Administración / RRHH (+8 more)

### Community 103 - "migrate-prod.js"
Cohesion: 0.20
Nodes (15): checksum(), { Client }, createPgClient(), crypto, destructiveResetRequested(), ensureMigrationTable(), findAppliedMigration(), fs (+7 more)

### Community 132 - "jest"
Cohesion: 0.15
Nodes (13): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+5 more)

### Community 133 - "tsconfig.build.json"
Cohesion: 0.15
Nodes (12): **/*.spec.ts, test, ./tsconfig.json, compilerOptions, outDir, rootDir, exclude, extends (+4 more)

### Community 134 - "AuthRepository"
Cohesion: 0.06
Nodes (34): IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, Res (+26 more)

### Community 136 - "Endpoints mínimos sugeridos"
Cohesion: 0.17
Nodes (12): Administración / RRHH, Asistencia, Contabilidad, Deuda y pagos, Endpoints mínimos sugeridos, Infraestructura, Inventario, Pago a tutores (+4 more)

### Community 137 - "CPA Plataforma Backend NestJS"
Cohesion: 0.17
Nodes (11): Backup programado Render -> Neon backup, CPA Plataforma Backend NestJS, Documentación relevante, Documento principal para el frontend, Migraciones, Patch venta-clase, lifecycle y balance de apertura, QA avanzado: importaciones, errores de negocio y backup, Redis opcional para producción (+3 more)

### Community 146 - "Cobertura principal"
Cohesion: 0.18
Nodes (10): Activo, Cobertura principal, Costos y gastos, Estructura, Ingresos, Nota contable, Objetivo, Pasivo (+2 more)

### Community 147 - "Patch: cuentas operativas configurables y cuentas por estudiante/tutor"
Cohesion: 0.18
Nodes (10): Cambiar la cuenta de QR, Cuentas creadas por estudiante, Cuentas creadas por tutor, Decisión contable, Endpoints CRUD/batch para configurar cuentas operativas, Impacto en venta-clase, Migración, Nueva tabla (+2 more)

### Community 148 - "Documentación general ultra detallada - CPA Plataforma Backend"
Cohesion: 0.18
Nodes (10): 1. Propósito del sistema, 2. Módulos principales, 3. Convención de respuestas, 4. Batch genérico, 5. Aulas y espacios, 6. Venta clase, 7. Configuración contable, 8. Usuarios base (+2 more)

### Community 149 - "permission.guard.ts"
Cohesion: 0.07
Nodes (33): RequirePermission(), ContabilidadModule, Module, ContabilidadEstadosFinancierosService, LineaEstado, Injectable, ContabilidadLibrosService, ORDEN_DIARIO (+25 more)

### Community 151 - "Endpoints batch y contabilidad avanzada"
Cohesion: 0.20
Nodes (9): Actualizar múltiples registros, Batch genérico por recurso, Compatibilidad con frontend Excel/CSV, Crear múltiples registros, Crear transacción contable con movimientos en batch, Endpoints batch y contabilidad avanzada, JSON, Multipart form-data (+1 more)

### Community 152 - "check-source-size.js"
Cohesion: 0.20
Nodes (8): exceptions, exceptionsPath, failures, fs, path, root, sourceRoot, warnings

### Community 157 - "Borradores y archivos independientes"
Cohesion: 0.22
Nodes (8): 1. Registros en borrador, 2. Archivos independientes, 3. Asociación archivo-transacción, 4. Crear archivo y asociación en una sola operación, 5. Recurso legado, Archivo maestro, Borradores y archivos independientes, CRUD oficial

### Community 158 - "CPA backend hardening programme"
Cohesion: 0.22
Nodes (8): CPA backend hardening programme, Non-negotiable release gate, Phase 0 — Containment and baseline, Phase 1 — Runtime and resource efficiency, Phase 2 — Application security, Phase 3 — Clean code and maintainability, Phase 4 — Accounting and financial integrity, Phase 5 — Verification and production gate

### Community 159 - "Guía local rápida: instalación, smoke tests y puerto ocupado"
Cohesion: 0.22
Nodes (8): 1. Instalar dependencias siempre después de descargar un ZIP nuevo, 2. Scripts correctos para levantar el backend, 3. Error EADDRINUSE en puerto 3000, 4. Alternativa: correr backend en otro puerto, 5. Orden recomendado local, 6. No necesitas levantar servidor para smoke local, En PowerShell, identifica el proceso, Guía local rápida: instalación, smoke tests y puerto ocupado

### Community 160 - "package.json"
Cohesion: 0.22
Nodes (8): description, engines, node, license, name, packageManager, private, version

### Community 192 - "Bootstrap de producción CPA Plataforma"
Cohesion: 0.25
Nodes (7): Bootstrap de producción CPA Plataforma, Ejecutar desde cero, Ejecutar sin borrar datos, Maria Sonia Caballero, Pablo Arauz Caballero, Usuario adicional agregado, Usuarios iniciales

### Community 193 - "Qué carga"
Cohesion: 0.17
Nodes (11): Correcciones aplicadas por `019_seed_catalogos_academicos_scz_correcciones.sql`, Cómo aplicar, Endpoints útiles para frontend, Más unidades educativas, `persona.unidad_educativa`, Qué carga, Se aplica solo, en cada arranque, Seed de catálogos académicos Santa Cruz ampliado (+3 more)

### Community 194 - "Patch contable: detalle de transacción venta y costo"
Cohesion: 0.25
Nodes (7): `contabilidad.transaccion_detalle_costo`, `contabilidad.transaccion_detalle_venta`, Migración, Patch contable: detalle de transacción venta y costo, Permisos agregados, Tablas nuevas, Vistas auxiliares

### Community 195 - "Financial and accounting control matrix"
Cohesion: 0.25
Nodes (7): Conclusion, Financial and accounting control matrix, Implemented technical controls, Mandatory accounting release tests, Production blockers requiring domain decisions, Reference set, Scope and interpretation

### Community 196 - "Redis en CPA Plataforma Backend"
Cohesion: 0.25
Nodes (7): Comportamiento con Redis, Comportamiento sin Redis, Objetivo, Redis en CPA Plataforma Backend, Render, Validación rápida, Variables de entorno

### Community 197 - "8. Separación de responsabilidades"
Cohesion: 0.25
Nodes (8): 8. Separación de responsabilidades, Controllers, DTOs, Mappers, Modules, Repositories, Schemas, Services

### Community 198 - "render-start.js"
Cohesion: 0.12
Nodes (19): candidates, entry, fs, path, { prepareDatabase }, root, { spawn }, { Client } (+11 more)

### Community 199 - "seed-reporteria-contable-permissions.js"
Cohesion: 0.27
Nodes (9): countReporteriaPermissions(), createPgClient(), { createSecurePgClient }, crypto, fs, { loadProjectEnv }, main(), path (+1 more)

### Community 236 - "Plan de cuentas CPA estandarizado"
Cohesion: 0.29
Nodes (6): Criterio aplicado, Patch 011, Plan de cuentas CPA estandarizado, Render, Resultado esperado, Seguridad incluida

### Community 237 - "Deploy en Render"
Cohesion: 0.29
Nodes (6): Build Command, Deploy en Render, Por qué no usar `node dist/main.js` directamente, Redis opcional, Start Command, Variables mínimas recomendadas

### Community 238 - "FRONTEND_CONTRATO_CPA_ULTRA_DETALLADO.md"
Cohesion: 0.29
Nodes (6): 0. Documento principal, 11. Checklist frontend, 7. Normalizador de respuestas, 9. Batch genérico, Contrato ultra detallado para Frontend - CPA Plataforma, Reportería contable - endpoint único para frontend

### Community 239 - "3. Tabla editable: Parte de clases pasadas"
Cohesion: 0.29
Nodes (7): 3.1 Pantalla requerida, 3.2 Endpoint principal, 3.3 Columnas visuales, 3.4 Reglas de envío, 3.5 Payload batch, 3.6 Respuesta esperada, 3. Tabla editable: Parte de clases pasadas

### Community 240 - "4. Catálogos necesarios para la tabla"
Cohesion: 0.29
Nodes (7): 4.1 Estudiantes, 4.2 Tutores, 4.3 Aulas, 4.4 Materias, temas y subtemas, 4.5 Productos educativos, 4.6 Unidades educativas, 4. Catálogos necesarios para la tabla

### Community 241 - "DOCUMENTO QUE DEBES PASAR AL FRONTEND"
Cohesion: 0.29
Nodes (6): Actualización importante: borradores y archivos, Añadido para reportería contable, Corrección urgente del error actual, Credenciales base reales para frontend, DOCUMENTO QUE DEBES PASAR AL FRONTEND, Manual adicional por patch venta-clase/lifecycle/apertura

### Community 242 - "Seed de permisos para reportería contable"
Cohesion: 0.29
Nodes (6): Cómo ejecutarlo, Nota de integración con frontend, Qué crea, Roles que reciben acceso, Seed de permisos para reportería contable, Validación rápida en SQL

### Community 243 - "Auditoría técnica - Reportería contable PowerBI"
Cohesion: 0.29
Nodes (6): Auditoría técnica - Reportería contable PowerBI, Cambio aplicado, Corrección adicional crítica, Cuentas de efectivo/disponible, Decisiones de calidad, Validaciones

### Community 244 - "Smoke test FULL - CPA Plataforma Backend"
Cohesion: 0.29
Nodes (6): Comando principal, Comando recomendado antes de producción, Nota honesta, Qué valida el smoke FULL, Smoke live contra backend desplegado, Smoke test FULL - CPA Plataforma Backend

### Community 245 - "Manejo de estados"
Cohesion: 0.29
Nodes (7): Clase, Deuda, Liquidación de tutor, Manejo de estados, Pago, Transacción contable, Usuario

### Community 246 - "smoke-live.js"
Cohesion: 0.29
Nodes (4): baseUrl, criticalRoutes, fs, path

### Community 252 - "Arquitectura NestJS aplicada"
Cohesion: 0.33
Nodes (5): Arquitectura NestJS aplicada, Decisión principal, Estructura, Recursos migrados, Reglas aplicadas del prompt del proyecto

### Community 253 - "Fix migración 006 - función de auditoría faltante"
Cohesion: 0.33
Nodes (5): Causa, Comando recomendado, Corrección, Fix migración 006 - función de auditoría faltante, Problema

### Community 255 - "Base de datos"
Cohesion: 0.33
Nodes (5): Base de datos, Ejecución manual con psql, Limpieza segura antes del seed, Smoke test funcional, Usuario interno oficial

### Community 256 - "Fix definitivo de contrato de listados para frontend"
Cohesion: 0.33
Nodes (5): Compatibilidad con formato anterior objeto, Corrección aplicada, Fix definitivo de contrato de listados para frontend, Lecturas válidas desde frontend, Problema

### Community 257 - "Corrección de listado CRUD para frontend"
Cohesion: 0.33
Nodes (5): Corrección de listado CRUD para frontend, Filtro estado_registro, Modo plano opcional, Problema, Solución aplicada

### Community 258 - "2. Error corregido: aulas"
Cohesion: 0.33
Nodes (6): 2.1 Problema anterior, 2.2 Solución implementada, 2.3 Endpoints de aula, 2.4 Listar aulas para select, 2.5 Crear aula, 2. Error corregido: aulas

### Community 259 - "Accounting production review checklist"
Cohesion: 0.33
Nodes (5): Accounting production review checklist, Accounting sign-off, Application, Database, Operations

### Community 260 - "UMLs - Centro de Clases Personalizadas"
Cohesion: 0.33
Nodes (5): Archivos incluidos, Cómo renderizar, Notas, Regla central del dominio, UMLs - Centro de Clases Personalizadas

### Community 261 - "Auditoría estricta - borradores y archivos independientes"
Cohesion: 0.33
Nodes (5): Auditoría estricta - borradores y archivos independientes, Endpoints nuevos principales, Recomendación frontend, Riesgos detectados, Verificación aplicada

### Community 262 - "Fix Render build: dist/main.js no generado"
Cohesion: 0.33
Nodes (5): Cambios aplicados, Causa probable, En Render, Error observado, Fix Render build: dist/main.js no generado

### Community 263 - "render-build.sh"
Cohesion: 0.33
Nodes (5): COREPACK_HOME, render-build.sh script, YARN_ENABLE_GLOBAL_CACHE, YARN_ENABLE_IMMUTABLE_INSTALLS, YARN_NODE_LINKER

### Community 282 - "Reporte de migración Express → NestJS"
Cohesion: 0.40
Nodes (4): Nota de ejecución local, Qué se corrigió, Reporte de migración Express → NestJS, Rutas conservadas

### Community 284 - "Endpoints nuevos: detalle de venta y costo"
Cohesion: 0.40
Nodes (4): Detalle de transacción de costo, Detalle de transacción de venta, Endpoints nuevos: detalle de venta y costo, Nota para frontend

### Community 285 - "10. Errores comunes y cómo mostrarlos"
Cohesion: 0.40
Nodes (5): 10.1 Recurso no encontrado, 10.2 Sesión inválida, 10.3 Cuenta contable faltante, 10.4 CxC o paquete sin estudiante, 10. Errores comunes y cómo mostrarlos

### Community 286 - "1.1 Login"
Cohesion: 0.40
Nodes (5): 1.1 Login, 1. Autenticación, Payload recomendado, Respuesta exitosa, Usuarios base

### Community 287 - "5. Configuración contable de cuentas operativas"
Cohesion: 0.40
Nodes (5): 5.1 Endpoint, 5.2 Claves importantes, 5.3 Flujo correcto, 5.4 Crear/editar configuración, 5. Configuración contable de cuentas operativas

### Community 288 - "Hardening audit baseline"
Cohesion: 0.40
Nodes (4): Confirmed high-priority findings, Evidence limitations, Hardening audit baseline, Scope

### Community 289 - "Clean-code and naming review"
Cohesion: 0.40
Nodes (4): Clean-code and naming review, Completed in HARDENING, Naming rule, Remaining controlled debt

### Community 290 - "Production readiness status"
Cohesion: 0.40
Nodes (4): Honest readiness statement, Implemented and reviewable, Production readiness status, Release blockers

### Community 291 - "Immediate credential incident response"
Cohesion: 0.40
Nodes (4): Confirmed condition, Evidence required to close the incident, Immediate credential incident response, Mandatory containment before production use

### Community 292 - "PostgreSQL backup and restore verification"
Cohesion: 0.40
Nodes (4): Backup controls, Journal-integrity verification, PostgreSQL backup and restore verification, Restore drill

### Community 293 - "Production deployment runbook"
Cohesion: 0.40
Nodes (4): Deployment sequence, Preconditions, Production deployment runbook, Rollback

### Community 295 - "Flujos principales"
Cohesion: 0.50
Nodes (3): CRUD protegido, Flujos principales, Login

### Community 298 - "Patch 011: venta-clase sin fiscal, apertura y lifecycle"
Cohesion: 0.50
Nodes (3): Asiento de apertura, Decisiones, Patch 011: venta-clase sin fiscal, apertura y lifecycle

### Community 299 - "Patch 005: venta_clase_registro"
Cohesion: 0.50
Nodes (3): Migración, Motivo del diseño, Patch 005: venta_clase_registro

### Community 300 - "Auth session: permisos reales en respuesta de sesión"
Cohesion: 0.50
Nodes (3): Auth session: permisos reales en respuesta de sesión, Campos relevantes, Endpoints

### Community 301 - "8. Servicio Axios recomendado"
Cohesion: 0.50
Nodes (4): 8.1 Login, 8.2 Cargar aulas, 8.3 Enviar venta clase batch, 8. Servicio Axios recomendado

### Community 302 - "nest-cli.json"
Cohesion: 0.50
Nodes (3): collection, $schema, sourceRoot

### Community 305 - "6. Cuentas automáticas por estudiante y tutor"
Cohesion: 0.67
Nodes (3): 6.1 Al crear estudiante, 6.2 Al crear tutor, 6. Cuentas automáticas por estudiante y tutor

### Community 306 - "Anexo: borradores y archivos independientes"
Cohesion: 0.67
Nodes (3): Anexo: borradores y archivos independientes, Archivos independientes, Borradores backend

### Community 308 - "Stack técnico obligatorio"
Cohesion: 0.67
Nodes (3): Herramientas permitidas en reemplazo de Sequelize y Zod, Restricciones obligatorias, Stack técnico obligatorio

### Community 309 - "21. Estrategias permitidas para envío de JWT"
Cohesion: 0.67
Nodes (3): 21. Estrategias permitidas para envío de JWT, Opción A: JWT en cookie httpOnly, Opción B: JWT como Bearer token

### Community 310 - "7. Versionado de API"
Cohesion: 0.67
Nodes (3): 7. Versionado de API, Opción A: prefijo por controller, Opción B: prefijo global y rutas versionadas

## Knowledge Gaps
- **788 isolated node(s):** `singleQuote`, `printWidth`, `trailingComma`, `arrowParens`, `eslint` (+783 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `xlsx` connect `dependencies` to `InventarioController`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `CrudService` connect `InventarioController` to `InfraestructuraController`, `ResourceModuleName`, `ddl.sql`, `auth.service.js`, `SeguridadController`, `deuda.controller.js`, `PersonasLifecycleService`, `app.module.ts`, `PasswordHasherService`, `AdministracionLifecycleService`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `singleQuote`, `printWidth`, `trailingComma` to the rest of the system?**
  _788 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ContabilidadAccountingService` be split into smaller, more focused modules?**
  _Cohesion score 0.10707070707070707 - nodes in this community are weakly interconnected._
- **Should `auth.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09653092006033183 - nodes in this community are weakly interconnected._
- **Should `PersonasLifecycleService` be split into smaller, more focused modules?**
  _Cohesion score 0.10064935064935066 - nodes in this community are weakly interconnected._