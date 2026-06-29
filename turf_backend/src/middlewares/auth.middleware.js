import jwt from "jsonwebtoken";
import { Apierror } from "../utils/api_error.js";

const getAccessTokenSecret = () => {
  return process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
};

const verifyJWT = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return next(new Apierror(401, "Authorization token is missing"));
    }

    const token = authorization.split(" ")[1];
    const secret = getAccessTokenSecret();
    if (!secret) {
      return next(new Apierror(500, "Access token secret is not configured"));
    }

    try {
      const decoded = jwt.verify(token, secret);
      const userId = decoded._id || decoded.id || decoded.userId;
      req.user = { ...decoded, id: userId, _id: userId };
      return next();
    } catch (error) {
      return next(new Apierror(401, "Invalid or expired token"));
    }
  } catch (error) {
    return next(error);
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new Apierror(401, "Authentication required"));
      }

      if (!roles.includes(req.user.role)) {
        return next(
          new Apierror(
            403,
            "You do not have permission to access this resource",
          ),
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export { verifyJWT, authorizeRoles };
