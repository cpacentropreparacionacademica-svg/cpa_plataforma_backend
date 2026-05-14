const router = require("express").Router();

const departamentoRouter = require("./router/departamento.router");
const empleadoRouter = require("./router/empleado.router");
const empleadoPosicionPagoRouter = require("./router/empleado_posicion_pago.router");
const empleadoRegistroPagoRouter = require("./router/empleado_registro_pago.router");
const kpiRouter = require("./router/kpi.router");
const objetivoKpiRouter = require("./router/objetivo_kpi.router");
const posicionRouter = require("./router/posicion.router");

router.use("/departamento", departamentoRouter);
router.use("/empleado", empleadoRouter);
router.use("/empleado-posicion-pago", empleadoPosicionPagoRouter);
router.use("/empleado-registro-pago", empleadoRegistroPagoRouter);
router.use("/kpi", kpiRouter);
router.use("/objetivo-kpi", objetivoKpiRouter);
router.use("/posicion", posicionRouter);

module.exports = {
    router,
    moduleName: "administracion",
    isPublic: false,
};
