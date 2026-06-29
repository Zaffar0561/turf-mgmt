import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Apiresponse } from "../utils/api_response.js";
import { Apierror } from "../utils/api_error.js";
import { asyncHandler } from "../utils/async_handler.js";
import {
  forgotpwdmailgencontent,
  otpMailContent,
  sendEmail,
} from "../utils/mail.js";

const getAccessTokenSecret = () =>
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
const getRefreshTokenSecret = () =>
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

const normalizeEmail = (email) => email?.trim().toLowerCase();
const getVerificationBaseUrl = () =>
  process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/verify-email`
    : "http://localhost:3000/api/v1/auth/verify-email";
const getResetPasswordBaseUrl = () =>
  process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/reset-password`
    : "http://localhost:3000/api/v1/auth/reset-password";

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
});

const registeruser = asyncHandler(async (req, res) => {
  const { name, email: rawEmail, password, phone } = req.body;
  const email = normalizeEmail(rawEmail);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Apierror(409, "User with this email already exists");
  }

  let user;
  try {
    user = await User.create({
      name,
      email,
      password,
      phone,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      throw new Apierror(409, "User with this email already exists");
    }
    throw error;
  }
  // generate OTP and send for verification
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  let verificationSent = false;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your verification code",
      mailgencontent: otpMailContent(user.name, otp),
    });
    verificationSent = true;
  } catch (err) {
    console.error(
      "Failed to send verification email for user",
      user.email,
      err,
    );
  }

  res.status(201).json(
    new Apiresponse(
      201,
      {
        user: buildUserPayload(user),
        verificationSent,
      },
      "Registration successful. Verify your email to continue",
    ),
  );
});

const login = asyncHandler(async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = normalizeEmail(rawEmail);
  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user || !(await user.comparePassword(password))) {
    throw new Apierror(401, "Invalid email or password");
  }

  if (!user.isEmailVerified) {
    throw new Apierror(
      403,
      "Email is not verified. Please verify your account first.",
    );
  }

  const tokens = await user.generateAuthTokens();

  res.status(200).json(
    new Apiresponse(
      200,
      {
        user: buildUserPayload(user),
        tokens,
      },
      "Login successful",
    ),
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email: rawEmail, otp } = req.body;
  const email = normalizeEmail(rawEmail);
  if (!email || !otp) {
    throw new Apierror(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email }).select("+otp +otpExpiry");
  if (!user || !user.verifyOTP(otp)) {
    throw new Apierror(400, "Invalid or expired OTP");
  }

  user.isEmailVerified = true;
  user.clearOTP();
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new Apiresponse(
      200,
      {
        user: buildUserPayload(user),
        verified: true,
      },
      "Email verified successfully",
    ),
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new Apierror(400, "Refresh token is required");
  }

  const secret = getRefreshTokenSecret();
  if (!secret) {
    throw new Apierror(500, "Refresh token secret is not configured");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, secret);
  } catch (err) {
    throw new Apierror(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== refreshToken) {
    throw new Apierror(401, "Refresh token is invalid");
  }

  const accessToken = user.generateAccessToken();

  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { accessToken },
        "Access token refreshed successfully",
      ),
    );
});

const forgotpasswordrequest = asyncHandler(async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = normalizeEmail(rawEmail);
  const user = await User.findOne({ email });
  if (!user) {
    throw new Apierror(404, "User not found");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${getResetPasswordBaseUrl()}/${resetToken}`;

  let resetSent = false;
  try {
    await sendEmail({
      email: user.email,
      subject: "Reset your password",
      mailgencontent: forgotpwdmailgencontent(user.name, resetUrl),
    });
    resetSent = true;
  } catch (err) {
    console.error("Failed to send password reset email to", user.email, err);
  }

  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { email: user.email, resetSent },
        "Password reset instructions sent",
      ),
    );
});

const resetForgotpassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!resetToken || !password) {
    throw new Apierror(400, "Reset token and new password are required");
  }

  const user = await User.findByResetToken(resetToken);
  if (!user) {
    throw new Apierror(400, "Invalid or expired reset token");
  }

  user.password = password;
  user.clearResetToken();
  await user.save();

  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { email: user.email, passwordReset: true },
        "Password reset successful",
      ),
    );
});

const logoutuser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new Apierror(400, "Refresh token is required to logout");
  }

  const secret = getRefreshTokenSecret();
  if (!secret) {
    throw new Apierror(500, "Refresh token secret is not configured");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, secret);
  } catch (err) {
    throw new Apierror(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  res
    .status(200)
    .json(new Apiresponse(200, { loggedOut: true }, "Logged out successfully"));
});

const getcurrentuser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new Apierror(404, "User not found");
  }

  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { user: buildUserPayload(user) },
        "Current user fetched successfully",
      ),
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new Apierror(400, "Current and new passwords are required");
  }

  const user = await User.findById(req.user.id).select("+password");
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new Apierror(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { passwordChanged: true },
        "Password changed successfully",
      ),
    );
});

const resendemailverification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new Apierror(404, "User not found");
  }

  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(
        new Apiresponse(
          200,
          { alreadyVerified: true },
          "Email already verified",
        ),
      );
  }

  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  let resent = false;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your verification code",
      mailgencontent: otpMailContent(user.name, otp),
    });
    resent = true;
  } catch (err) {
    console.error("Failed to resend verification email to", user.email, err);
  }

  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { verificationSent: resent },
        "Verification email resent successfully",
      ),
    );
});

const resendEmailVerificationByEmail = asyncHandler(async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new Apierror(400, "Valid email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Apierror(404, "User not found");
  }

  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(
        new Apiresponse(
          200,
          { alreadyVerified: true },
          "Email already verified",
        ),
      );
  }

  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  let resentByEmail = false;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your verification code",
      mailgencontent: otpMailContent(user.name, otp),
    });
    resentByEmail = true;
  } catch (err) {
    console.error(
      "Failed to resend verification email by email to",
      user.email,
      err,
    );
  }

  res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { verificationSent: resentByEmail },
        "Verification email resent successfully",
      ),
    );
});

export {
  registeruser,
  login,
  verifyEmail,
  refreshAccessToken,
  forgotpasswordrequest,
  resetForgotpassword,
  logoutuser,
  getcurrentuser,
  changeCurrentPassword,
  resendemailverification,
  resendEmailVerificationByEmail,
};
