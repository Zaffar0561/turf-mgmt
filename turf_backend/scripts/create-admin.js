import dotenv from "dotenv";
dotenv.config();

import Connectdb from "../src/Db/index.js";
import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";

const run = async () => {
  try {
    await Connectdb();

    const name = process.env.ADMIN_NAME || "Admin User";
    const email = (
      process.env.ADMIN_EMAIL || "admin@example.com"
    ).toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "admin123";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin with email ${email} already exists.`);
      process.exit(0);
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      isEmailVerified: true,
    });

    console.log("Admin created:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err);
    process.exit(1);
  }
};

run();
