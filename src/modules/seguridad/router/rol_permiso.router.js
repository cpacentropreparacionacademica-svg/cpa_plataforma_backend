const router = require("express").Router();
const RolPermisoController = require("../controller/rol_permiso.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "rol_permiso.router" });

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
} = require("../schemas/rol_permiso.schema");

router.post(
  "/",
  validateBody(createSchema, logger, "rol_permiso_creation"),
  RolPermisoController.create
);

router.put(
  "/:id_rol/:id_permiso",
  validateParams(idSchema, logger, "rol_permiso_update"),
  validateBody(updateSchema, logger, "rol_permiso_update"),
  RolPermisoController.update
);

router.get(
  "/:id_rol/:id_permiso",
  validateParams(idSchema, logger, "rol_permiso_get"),
  RolPermisoController.get
);

router.get(
  "/",
  validateQuery(querySchema, logger, "rol_permiso_list"),
  RolPermisoController.list
);

module.exports = router;
