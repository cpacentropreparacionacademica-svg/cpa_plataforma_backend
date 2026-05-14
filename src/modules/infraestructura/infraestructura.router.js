const router = require("express").Router();

const edificioRouter = require("./router/edificio.router");
const encargadoRouter = require("./router/encargado.router");
const espacioRouter = require("./router/espacio.router");
const sucursalRouter = require("./router/sucursal.router");
const tiendaRouter = require("./router/tienda.router");

router.use("/edificio", edificioRouter);
router.use("/encargado", encargadoRouter);
router.use("/espacio", espacioRouter);
router.use("/sucursal", sucursalRouter);
router.use("/tienda", tiendaRouter);

module.exports = {
    router,
    moduleName: "infraestructura",
    isPublic: false,
};
