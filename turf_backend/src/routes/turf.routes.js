import { Router } from "express";
import { requireRole } from "../middlewares/role_based.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  validateCreateTurf,
  validateUpdateTurf,
  validateTurfId,
  validateTurfFilters,
  handleValidationErrors,
} from "../validators/turf.validators.js";
import {
  createTurf,
  getOwnerTurfs,
  updateTurf,
  deleteTurf,
  uploadTurfImages,
  getAllTurfs,
  getSingleTurf,
} from "../controllers/turf.controller.js";

const router = Router();

//Get all turfs with filters
router
  .route("/search/all")
  .get(validateTurfFilters, handleValidationErrors, getAllTurfs);

// Create turf
router
  .route("/create-turf")
  .post(requireRole("turf_owner"), validateCreateTurf, handleValidationErrors, createTurf);

//Get single turf
router
  .route("/:turfId")
  .get(validateTurfId, handleValidationErrors, getSingleTurf);

// Get owner's turfs
router.get("/owner/my-turfs", requireRole("turf_owner"), getOwnerTurfs);

// Update turf
router
  .route("/:turfId")
  .put(
    requireRole("turf_owner"),
    validateTurfId,
    validateUpdateTurf,
    handleValidationErrors,
    updateTurf,
  );

// Delete turf
router
  .route("/:turfId")
  .delete(requireRole("turf_owner"), validateTurfId, handleValidationErrors, deleteTurf);

// Upload images
router
  .route("/:turfId/upload-images")
  .post(
    requireRole("turf_owner"),
    validateTurfId,
    handleValidationErrors,
    upload.array("images", 5),
    uploadTurfImages,
  );

export default router;
