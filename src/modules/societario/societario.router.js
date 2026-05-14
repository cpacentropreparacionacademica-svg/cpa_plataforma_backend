const router = require("express").Router();

const claseTituloRouter = require("./router/clase_titulo.router");
const dividendoRouter = require("./router/dividendo.router");
const dividendoPagoRouter = require("./router/dividendo_pago.router");
const emisionTituloRouter = require("./router/emision_titulo.router");
const tenenciaRouter = require("./router/tenencia.router");
const titularRouter = require("./router/titular.router");
const transferenciaTituloRouter = require("./router/transferencia_titulo.router");

router.use("/clase-titulo", claseTituloRouter);
router.use("/dividendo", dividendoRouter);
router.use("/dividendo-pago", dividendoPagoRouter);
router.use("/emision-titulo", emisionTituloRouter);
router.use("/tenencia", tenenciaRouter);
router.use("/titular", titularRouter);
router.use("/transferencia-titulo", transferenciaTituloRouter);

module.exports = {
    router,
    moduleName: "societario",
    isPublic: false,
};
