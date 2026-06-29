import { body } from "express-validator";

const userRegisterValidator = () => [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Phone number must be exactly 10 digits")
    .matches(/^\d{10}$/)
    .withMessage("Phone number must contain only digits"),
  // role is removed from registration; admin should be created via script
];

const userLoginValidator = () => [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const userForgotPasswordValidator = () => [
  body("email").trim().isEmail().withMessage("Valid email is required"),
];

const userResetForgotPasswordValidator = () => [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const userChangeCurrentPasswordValidator = () => [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

export {
  userRegisterValidator,
  userLoginValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  userChangeCurrentPasswordValidator,
};
