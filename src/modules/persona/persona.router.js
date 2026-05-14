const router = require("express").Router();

const estudiantePadreRouter = require("./router/estudiante_padre.router");
const personaEstudianteRouter = require("./router/persona_estudiante.router");
const personaPadreRouter = require("./router/persona_padre.router");
const personaTutorRouter = require("./router/persona_tutor.router");
const personaUsuarioRouter = require("./router/persona_usuario.router");
const proveedorRouter = require("./router/proveedor.router");
const unidadEducativaRouter = require("./router/unidad_educativa.router");

router.use("/estudiante-padre", estudiantePadreRouter);
router.use("/estudiante", personaEstudianteRouter);
router.use("/padre", personaPadreRouter);
router.use("/tutor", personaTutorRouter);
router.use("/usuario", personaUsuarioRouter);
router.use("/proveedor", proveedorRouter);
router.use("/unidad-educativa", unidadEducativaRouter);

module.exports = {
    router,
    moduleName: "personas",
    isPublic: false,
};
