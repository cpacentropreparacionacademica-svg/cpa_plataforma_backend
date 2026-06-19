# Shared CRUD

Contiene el servicio CRUD reutilizable para los módulos del sistema.  
No usa Sequelize ni Zod. La validación estructural se apoya en NestJS, class-validator para DTOs específicos y una lista blanca de columnas obtenida desde PostgreSQL.
