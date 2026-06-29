import express, { urlencoded } from "express";
import cors from "cors";
import multer from "multer";
import { Apierror } from "./src/utils/api_error.js";

const app = express();

import healthcheckrouter from "./src/routes/healthcheck.routes.js";
import authRouter from "./src/routes/auth.routes.js";
import turfRouter from "./src/routes/turf.routes.js";
import roleBasedRouter from "./src/routes/role_based.routes.js";
import uploadRouter from "./src/routes/upload.routes.js";

//to fix cors error
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use("/api/v1/healthcheck", healthcheckrouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/turfs", turfRouter);
app.use("/api/v1/roles", roleBasedRouter);
app.use("/api/v1/uploads", uploadRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the Turf management app");
});

app.use((err, req, res, next) => {
  if (err instanceof Apierror) {
    return res.status(err.statuscode || 500).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      data: err.data || null,
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: [],
      data: null,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
    data: null,
  });
});

export default app;
