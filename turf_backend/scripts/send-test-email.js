import dotenv from "dotenv";
import { sendEmail, otpMailContent } from "../src/utils/mail.js";

dotenv.config();

const run = async () => {
  try {
    await sendEmail({
      email: process.env.ADMIN_EMAIL || "test@example.com",
      subject: "Test email from Turf Management",
      mailgencontent: otpMailContent("Test User", "123456"),
    });
    console.log("Test email attempt finished.");
  } catch (err) {
    console.error("Test email failed:", err);
  }
};

run();
