# Database

La migración eliminó Sequelize y usa TypeORM únicamente como capa de conexión a PostgreSQL.  
Los CRUD se ejecutan con SQL parametrizado y una lista blanca de recursos definida en `src/modules/resource-registry.ts`.

Decisión importante: no se activó `synchronize` para evitar que NestJS modifique el esquema real. El DDL original queda en `docs/db/ddl.sql`.
