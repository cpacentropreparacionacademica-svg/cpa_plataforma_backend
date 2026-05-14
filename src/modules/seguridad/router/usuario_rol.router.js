const router = require("express").Router();
const UsuarioRolController = require("../controller/usuario_rol.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "usuario_rol.router" });

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
} = require("../schemas/usuario_rol.schema");

router.post(
  "/",
  validateBody(createSchema, logger, "usuario_rol_creation"),
  UsuarioRolController.create
);

router.put(
  "/:id_persona/:id_rol",
  validateParams(idSchema, logger, "usuario_rol_update"),
  validateBody(updateSchema, logger, "usuario_rol_update"),
  UsuarioRolController.update
);

router.get(
  "/:id_persona/:id_rol",
  validateParams(idSchema, logger, "usuario_rol_get"),
  UsuarioRolController.get
);

router.get(
  "/",
  validateQuery(querySchema, logger, "usuario_rol_list"),
  UsuarioRolController.list
);

module.exports = router;
