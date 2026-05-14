const router = require("express").Router();
const requirePermission = require("../../../../middlewares/validate.permissions.middleware");
const TransferenciaTituloController = require("../controller/transferencia_titulo.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "transferencia_titulo.router" });

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
} = require("../schemas/transferencia_titulo.schema");

router.post(
  "/",
  requirePermission("SOCIETARIO.TRANSFERENCIA_TITULO.CREATE"),
  validateBody(createSchema, logger, "transferencia_titulo_creation"),
  TransferenciaTituloController.create
);

router.put(
  "/:id_transferencia",
  requirePermission("SOCIETARIO.TRANSFERENCIA_TITULO.UPDATE"),
  validateParams(idSchema, logger, "transferencia_titulo_update"),
  validateBody(updateSchema, logger, "transferencia_titulo_update"),
  TransferenciaTituloController.update
);

router.get(
  "/:id_transferencia",
  requirePermission("SOCIETARIO.TRANSFERENCIA_TITULO.READ"),
  validateParams(idSchema, logger, "transferencia_titulo_get"),
  TransferenciaTituloController.get
);

router.get(
  "/",
  requirePermission("SOCIETARIO.TRANSFERENCIA_TITULO.READ"),
  validateQuery(querySchema, logger, "transferencia_titulo_list"),
  TransferenciaTituloController.list
);

module.exports = router;
