const router = require("express").Router();
const AuthController = require("../controller/auth.controller");
const rootLogger = require("../../../../logs/logger");

const logger = rootLogger.child({ module: "auth.router" });

const { validateBody } = require("../../../../middlewares/validate.middleware");

const {
  loginSchema,
  signupSchema,
  changePasswordSchema,
  activateUserSchema,
  requestNewPasswordTokenSchema,
} = require("../schemas/auth.schema");

router.post(
  "/login",
  validateBody(loginSchema, logger, "login"),
  AuthController.login
);

router.post(
  "/signup",
  validateBody(signupSchema, logger, "signup"),
  AuthController.signup
);

router.post(
  "/change-password",
  validateBody(changePasswordSchema, logger, "change_password"),
  AuthController.changePassword
);

router.post(
  "/activate-user",
  validateBody(activateUserSchema, logger, "activate_user"),
  AuthController.activateUser
);

router.post(
  "/request-new-password-token",
  validateBody(requestNewPasswordTokenSchema, logger, "request_new_password_token"),
  AuthController.requestNewPasswordToken
);

module.exports = router;