const router = require("express").Router();

const bienRouter = require("./router/bien.router");
const bienInstanciaRouter = require("./router/bien_instancia.router");
const bienLoteRouter = require("./router/bien_lote.router");
const movimientoDetalleRouter = require("./router/movimiento_detalle.router");

router.use("/bien", bienRouter);
router.use("/bien-instancia", bienInstanciaRouter);
router.use("/bien-lote", bienLoteRouter);
router.use("/movimiento-detalle", movimientoDetalleRouter);

module.exports = {
    router,
    moduleName: "inventario",
    isPublic: false,
};
