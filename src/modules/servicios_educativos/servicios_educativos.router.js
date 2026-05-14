const router = require("express").Router();

const asistenciaClaseCursoRouter = require("./router/asistencia_clase_curso.router");
const claseCursoRouter = require("./router/clase_curso.router");
const clasePorHoraRouter = require("./router/clase_por_hora.router");
const cursoVersionRouter = require("./router/curso_version.router");
const horariosRouter = require("./router/horarios.router");
const materiaTreeRouter = require("./router/materia_tree.router");
const paquetesProductoEducativoRouter = require("./router/paquetes_producto_educativo.router");
const productoEducativoRouter = require("./router/producto_educativo.router");

router.use("/asistencia-clase-curso", asistenciaClaseCursoRouter);
router.use("/clase-curso", claseCursoRouter);
router.use("/clase-por-hora", clasePorHoraRouter);
router.use("/curso-version", cursoVersionRouter);
router.use("/horarios", horariosRouter);
router.use("/materia-tree", materiaTreeRouter);
router.use("/paquetes-producto-educativo", paquetesProductoEducativoRouter);
router.use("/producto-educativo", productoEducativoRouter);

module.exports = {
    router,
    moduleName: "servicios_educativos",
    isPublic: false,
};
