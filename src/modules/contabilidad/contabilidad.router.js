const router = require("express").Router();

const archivosTransaccionRouter = require("./router/archivos_transaccion.router");
const centroCostoRouter = require("./router/centro_costo.router");
const centroCostoMapaRouter = require("./router/centro_costo_mapa.router");
const conceptoCostoRouter = require("./router/concepto_costo.router");
const cuentaRouter = require("./router/cuenta.router");
const cuentaAsignacionRouter = require("./router/cuenta_asignacion.router");
const grupoCuentaRouter = require("./router/grupo_cuenta.router");
const pagoTutorRouter = require("./router/pago_tutor.router");
const pagoTutorDetalleRouter = require("./router/pago_tutor_detalle.router");
const transaccionRouter = require("./router/transaccion.router");
const transaccionMovimientoCuentaRouter = require("./router/transaccion_movimiento_cuenta.router");

router.use("/archivos-transaccion", archivosTransaccionRouter);
router.use("/centro-costo", centroCostoRouter);
router.use("/centro-costo-mapa", centroCostoMapaRouter);
router.use("/concepto-costo", conceptoCostoRouter);
router.use("/cuenta", cuentaRouter);
router.use("/cuenta-asignacion", cuentaAsignacionRouter);
router.use("/grupo-cuenta", grupoCuentaRouter);
router.use("/pago-tutor", pagoTutorRouter);
router.use("/pago-tutor-detalle", pagoTutorDetalleRouter);
router.use("/transaccion", transaccionRouter);
router.use("/transaccion-movimiento-cuenta", transaccionMovimientoCuentaRouter);

module.exports = {
    router,
    moduleName: "contabilidad",
    isPublic: false,
};
