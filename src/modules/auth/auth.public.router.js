const router = require("express").Router();
const authRouter = require("./router/auth.public.router");

router.use("/publicAuth", authRouter);

module.exports = {
    router,
    moduleName: "auth",
    isPublic: true,
};
