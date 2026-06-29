import { body, param, query, validationResult } from "express-validator";

export const validateCreateTurf = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Turf name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters"),
  body("description").notEmpty().withMessage("Description is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location/Address is required"),
  body("pricePerHour")
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((value) => value > 0)
    .withMessage("Price must be greater than 0"),
  body("size")
    .optional()
    .isIn(["small", "medium", "large"])
    .withMessage("Size must be small, medium, or large"),
];

export const validateUpdateTurf = [
  body("name").optional().trim(),

  body("description").optional(),

  body("city").optional().trim(),
  body("location").optional().trim(),
  body("pricePerHour")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((value) => value > 0)
    .withMessage("Price must be greater than 0"),
  body("size")
    .optional()
    .isIn(["small", "medium", "large"])
    .withMessage("Size must be small, medium, or large"),

  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be true or false"),
];

export const validateTurfId = [
  param("turfId").custom((value) => {
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
      throw new Error("Invalid turf ID");
    }
    return true;
  }),
];

export const validateTurfFilters = [
  query("city").optional().trim(),
  query("size")
    .optional()
    .isIn(["small", "medium", "large"])
    .withMessage("Size must be small, medium, or large"),
  query("minPrice")
    .optional()
    .isNumeric()
    .withMessage("minPrice must be a number"),
  query("maxPrice")
    .optional()
    .isNumeric()
    .withMessage("maxPrice must be a number"),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};
