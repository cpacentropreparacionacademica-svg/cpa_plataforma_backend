const router = require("express").Router();
const UsuarioPermisoController = require("../controller/usuario_permiso.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "usuario_permiso.router" });

const {
  validateBody,
  validateParams,
  validateQuery,
} = require("../../../../middlewares/validate.middleware");

const {
  createSchema,
  updateSchema,
  idSchema,
  querySchema,
} = require("../schemas/usuario_permiso.schema");

router.post(
  "/",
  validateBody(createSchema, logger, "usuario_permiso_creation"),
  UsuarioPermisoController.create
);

router.put(
  "/:id_persona/:id_permiso",
  validateParams(idSchema, logger, "usuario_permiso_update"),
  validateBody(updateSchema, logger, "usuario_permiso_update"),
  UsuarioPermisoController.update
);

router.get(
  "/:id_persona/:id_permiso",
  validateParams(idSchema, logger, "usuario_permiso_get"),
  UsuarioPermisoController.get
);

router.get(
  "/",
  validateQuery(querySchema, logger, "usuario_permiso_list"),
  UsuarioPermisoController.list
);

module.exports = router;
