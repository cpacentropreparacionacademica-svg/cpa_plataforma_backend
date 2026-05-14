const authPublicRouter = require("./auth/auth.public.router");
const authPrivateRouter = require("./auth/auth.private.router");
const administracionRouter = require("./administracion/administracion.router");
const contabilidadRouter = require("./contabilidad/contabilidad.router");
const deudaRouter = require("./deuda/deuda.router");
const infraestructuraRouter = require("./infraestructura/infraestructura.router");
const inventarioRouter = require("./inventario/inventario.router");
const personaRouter = require("./persona/persona.router");
const seguridadRouter = require("./seguridad/seguridad.router");
const serviciosEducativosRouter = require("./servicios_educativos/servicios_educativos.router");
const societarioRouter = require("./societario/societario.router");

module.exports = [
  authPublicRouter,
  authPrivateRouter,
  administracionRouter,
  contabilidadRouter,
  deudaRouter,
  infraestructuraRouter,
  inventarioRouter,
  personaRouter,
  seguridadRouter,
  serviciosEducativosRouter,
  societarioRouter,
];
