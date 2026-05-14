const router = require("express").Router();
const RolController = require("../controller/rol.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "rol.router" });

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
} = require("../schemas/rol.schema");

router.post(
  "/",
  validateBody(createSchema, logger, "rol_creation"),
  RolController.create
);

router.put(
  "/:id_rol",
  validateParams(idSchema, logger, "rol_update"),
  validateBody(updateSchema, logger, "rol_update"),
  RolController.update
);

router.get(
  "/:id_rol",
  validateParams(idSchema, logger, "rol_get"),
  RolController.get
);

router.get(
  "/",
  validateQuery(querySchema, logger, "rol_list"),
  RolController.list
);

module.exports = router;
