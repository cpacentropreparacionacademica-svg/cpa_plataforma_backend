const router = require("express").Router();

const deudaRouter = require("./router/deuda.router");
const pagoRouter = require("./router/pago.router");

router.use("/deuda", deudaRouter);
router.use("/pago", pagoRouter);

module.exports = {
    router,
    moduleName: "deuda",
    isPublic: false,
};
