import { Router } from "express";
import {
  changeCurrentPassword,
  forgotpasswordrequest,
  getcurrentuser,
  refreshAccessToken,
  registeruser,
  resendemailverification,
  resendEmailVerificationByEmail,
  resetForgotpassword,
  verifyEmail,
  login,
  logoutuser,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userForgotPasswordValidator,
  userChangeCurrentPasswordValidator,
  userResetForgotPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(userRegisterValidator(), validate, registeruser);
router.route("/login").post(userLoginValidator(), validate, login);
router.route("/verify-email").post(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotpasswordrequest);
router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validate, resetForgotpassword);

router.route("/logout").post(verifyJWT, logoutuser);
router.route("/current-user").get(verifyJWT, getcurrentuser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword,
  );
router
  .route("/resend-email-verification")
  .post(verifyJWT, resendemailverification);

router
  .route("/resend-email-verification/by-email")
  .post(
    userForgotPasswordValidator(),
    validate,
    resendEmailVerificationByEmail,
  );

export default router;
