import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  validateCreateTurf,
  validateUpdateTurf,
  validateTurfId,
  validateTurfFilters,
  handleValidationErrors,
} from "../validators/turf.validators.js";
import {
  adminCreateUser,
  adminCreateCustomer,
  adminCreateTurfOwner,
  adminGetUsers,
  adminGetCustomers,
  adminGetTurfOwners,
  adminGetUser,
  adminUpdateUser,
  adminDeleteUser,
  customerGetAllTurfs,
  customerGetSingleTurf,
  turfOwnerCreateTurf,
  turfOwnerGetMyTurfs,
  turfOwnerUpdateTurf,
  turfOwnerDeleteTurf,
  turfOwnerUploadImages,
} from "../controllers/role_based.controller.js";
import {
  adminOnly,
  turfOwnerOnly,
} from "../middlewares/role_based.middleware.js";

const router = Router();

// Customer routes
router
  .route("/customer/turfs")
  .get(validateTurfFilters, handleValidationErrors, customerGetAllTurfs);

router
  .route("/customer/turfs/:turfId")
  .get(validateTurfId, handleValidationErrors, customerGetSingleTurf);

// Turf owner routes
router
  .route("/turf-owner/turfs")
  .post(
    turfOwnerOnly,
    validateCreateTurf,
    handleValidationErrors,
    turfOwnerCreateTurf,
  );

router.get("/turf-owner/my-turfs", turfOwnerOnly, turfOwnerGetMyTurfs);

router
  .route("/turf-owner/turfs/:turfId")
  .put(
    turfOwnerOnly,
    validateTurfId,
    validateUpdateTurf,
    handleValidationErrors,
    turfOwnerUpdateTurf,
  )
  .delete(
    turfOwnerOnly,
    validateTurfId,
    handleValidationErrors,
    turfOwnerDeleteTurf,
  );

router
  .route("/turf-owner/turfs/:turfId/images")
  .post(
    turfOwnerOnly,
    validateTurfId,
    handleValidationErrors,
    upload.array("images", 5),
    turfOwnerUploadImages,
  );

// Admin routes
router
  .route("/admin/users")
  .get(adminOnly, adminGetUsers)
  .post(adminOnly, adminCreateUser);

router
  .route("/admin/customers")
  .get(adminOnly, adminGetCustomers)
  .post(adminOnly, adminCreateCustomer);
router
  .route("/admin/turf-owners")
  .get(adminOnly, adminGetTurfOwners)
  .post(adminOnly, adminCreateTurfOwner);
router
  .route("/admin/users/:userId")
  .get(adminOnly, adminGetUser)
  .put(adminOnly, adminUpdateUser)
  .delete(adminOnly, adminDeleteUser);

export default router;
