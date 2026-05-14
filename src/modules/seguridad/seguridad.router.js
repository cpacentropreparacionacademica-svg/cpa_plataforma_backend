const router = require("express").Router();

const permisoRouter = require("./router/permiso.router");
const rolRouter = require("./router/rol.router");
const rolPermisoRouter = require("./router/rol_permiso.router");
const usuarioPermisoRouter = require("./router/usuario_permiso.router");
const usuarioRolRouter = require("./router/usuario_rol.router");

router.use("/permiso", permisoRouter);
router.use("/rol", rolRouter);
router.use("/rol-permiso", rolPermisoRouter);
router.use("/usuario-permiso", usuarioPermisoRouter);
router.use("/usuario-rol", usuarioRolRouter);

module.exports = {
    router,
    moduleName: "seguridad",
    isPublic: false,
};
