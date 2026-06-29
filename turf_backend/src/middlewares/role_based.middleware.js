import { verifyJWT, authorizeRoles } from "./auth.middleware.js";

const customerOnly = [verifyJWT, authorizeRoles("customer")];
const turfOwnerOnly = [verifyJWT, authorizeRoles("turf_owner")];
const adminOnly = [verifyJWT, authorizeRoles("admin")];

const requireRole = (...roles) => [verifyJWT, authorizeRoles(...roles)];

export { customerOnly, turfOwnerOnly, adminOnly, requireRole };
