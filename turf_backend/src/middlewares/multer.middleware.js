import multer from "multer";
import path from "path";
import fs from "fs";
import { Apierror } from "../utils/api_error.js";

const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimes.includes(file.mimetype) ||
    allowedExtensions.includes(extension)
  ) {
    cb(null, true);
  } else {
    cb(new Apierror(400, "Only image files are allowed"));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
