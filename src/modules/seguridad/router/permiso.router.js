const router = require("express").Router();
const PermisoController = require("../controller/permiso.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "permiso.router" });

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
} = require("../schemas/permiso.schema");

router.post(
  "/",
  validateBody(createSchema, logger, "permiso_creation"),
  PermisoController.create
);

router.put(
  "/:id_permiso",
  validateParams(idSchema, logger, "permiso_update"),
  validateBody(updateSchema, logger, "permiso_update"),
  PermisoController.update
);

router.get(
  "/:id_permiso",
  validateParams(idSchema, logger, "permiso_get"),
  PermisoController.get
);

router.get(
  "/",
  validateQuery(querySchema, logger, "permiso_list"),
  PermisoController.list
);

module.exports = router;
