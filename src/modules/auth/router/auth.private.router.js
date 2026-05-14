const router = require("express").Router();
const AuthController = require("../controller/auth.controller");

router.get("/me", AuthController.me);
router.post("/me", AuthController.me);
router.post("/refresh-session", AuthController.refreshSession);
router.post("/refreshSession", AuthController.refreshSession);
router.post("/logout", AuthController.logout);

module.exports = router;
