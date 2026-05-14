const router = require("express").Router();
const authRouter = require("./router/auth.private.router");

router.use("/privateAuth", authRouter);

module.exports = {
    router,
    moduleName: "auth",
    isPublic: false,
};
