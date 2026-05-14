const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const MateriaTreeController = require("../controller/materia_tree.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "materia_tree.router" });

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
} = require("../schemas/materia_tree.schema");

router.post(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.MATERIA_TREE.CREATE"),
  validateBody(createSchema, logger, "materia_tree_creation"),
  MateriaTreeController.create
);

router.put(
  "/:id_tree",
  requirePermission("SERVICIOS_EDUCATIVOS.MATERIA_TREE.UPDATE"),
  validateParams(idSchema, logger, "materia_tree_update"),
  validateBody(updateSchema, logger, "materia_tree_update"),
  MateriaTreeController.update
);

router.get(
  "/:id_tree",
  requirePermission("SERVICIOS_EDUCATIVOS.MATERIA_TREE.READ"),
  validateParams(idSchema, logger, "materia_tree_get"),
  MateriaTreeController.get
);

router.get(
  "/",
  requirePermission("SERVICIOS_EDUCATIVOS.MATERIA_TREE.READ"),
  validateQuery(querySchema, logger, "materia_tree_list"),
  MateriaTreeController.list
);

module.exports = router;
