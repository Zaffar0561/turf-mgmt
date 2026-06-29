import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserRolesEnum, AvailableUserRoles } from "../utils/constant.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.CUSTOMER,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
    },
    emailVerificationtoken: {
      type: String,
    },
    emailverificationExpiry: {
      type: Date,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};
//generate the accesstoken
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    },
  );
};

//genrate the refreshtoken
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
    },
  );
};

//otp gen,verify and clear
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  this.otp = otp;
  this.otpExpiry = otpExpiry;

  return otp;
};

userSchema.methods.verifyOTP = function (incomingOTP) {
  const isMatch = this.otp === incomingOTP;
  const isNotExpired = this.otpExpiry > new Date();

  return isMatch && isNotExpired;
};

userSchema.methods.clearOTP = function () {
  this.otp = null;
  this.otpExpiry = null;
};

userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.resetPasswordToken = hashedToken;

  this.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
  return rawToken;
};

userSchema.statics.findByResetToken = function (rawToken) {
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return this.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: new Date() },
  }).select("+password");
};

userSchema.methods.clearResetToken = function () {
  this.resetPasswordToken = null;
  this.resetPasswordExpiry = null;
};

userSchema.methods.generateEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.emailVerificationtoken = hashedToken;
  this.emailverificationExpiry = new Date(Date.now() + 60 * 60 * 1000);

  return rawToken;
};

userSchema.statics.findByEmailVerificationToken = async function (rawToken) {
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return this.findOne({
    emailVerificationtoken: hashedToken,
    emailverificationExpiry: { $gt: new Date() },
  });
};

userSchema.methods.clearEmailVerificationToken = function () {
  this.emailVerificationtoken = null;
  this.emailverificationExpiry = null;
};

userSchema.methods.generateAuthTokens = async function () {
  const accessToken = this.generateAccessToken();
  const refreshToken = this.generateRefreshToken();

  this.refreshToken = refreshToken;
  await this.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const User = mongoose.model("User", userSchema);
