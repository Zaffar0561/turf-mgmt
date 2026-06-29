import { validationResult } from "express-validator";
import { Apierror } from "../utils/api_error.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errormsg = errors.array().map((err) => ({
    [err.path]: err.msg,
  }));

  return next(new Apierror(422, "Received data is not valid", errormsg));
};
