import { User } from "../models/user.model.js";
import { Apierror } from "../utils/api_error.js";
import { Apiresponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";
import * as turfController from "./turf.controller.js";
import { UserRolesEnum, AvailableUserRoles } from "../utils/constant.js";
import { otpMailContent, sendEmail } from "../utils/mail.js";

const normalizeEmail = (email) => email?.trim().toLowerCase();

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
});

const adminCreateUser = asyncHandler(async (req, res) => {
  const { name, email: rawEmail, password, phone, role } = req.body;
  const email = normalizeEmail(rawEmail);

  if (!name || !email || !password || !role) {
    throw new Apierror(400, "Name, email, password, and role are required");
  }

  if (![UserRolesEnum.CUSTOMER, UserRolesEnum.TURF_OWNER].includes(role)) {
    throw new Apierror(
      400,
      "Admin can only create customer or turf_owner accounts",
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Apierror(409, "User with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
  });

  let verificationSent = false;
  try {
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    await sendEmail({
      email: user.email,
      subject: "Your verification code",
      mailgencontent: otpMailContent(user.name, otp),
    });
    verificationSent = true;
  } catch (err) {
    console.error(
      "Failed to send verification email for admin-created user",
      user.email,
      err,
    );
  }

  return res
    .status(201)
    .json(
      new Apiresponse(
        201,
        { user: buildUserPayload(user), verificationSent },
        "User created successfully",
      ),
    );
});

const adminCreateCustomer = asyncHandler(async (req, res, next) => {
  req.body.role = UserRolesEnum.CUSTOMER;
  return adminCreateUser(req, res, next);
});

const adminCreateTurfOwner = asyncHandler(async (req, res, next) => {
  req.body.role = UserRolesEnum.TURF_OWNER;
  return adminCreateUser(req, res, next);
});

const getUsers = async ({ role, page = 1, limit = 20 }) => {
  const filter = {};

  if (role) {
    if (!AvailableUserRoles.includes(role)) {
      throw new Apierror(400, "Invalid role filter");
    }
    filter.role = role;
  }

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);
  const skip = (pageNumber - 1) * pageSize;

  const users = await User.find(filter)
    .skip(skip)
    .limit(pageSize)
    .select("-password -refreshToken");

  const total = await User.countDocuments(filter);

  return {
    users,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    },
  };
};

const adminGetUsers = asyncHandler(async (req, res) => {
  const data = await getUsers(req.query);

  return res
    .status(200)
    .json(new Apiresponse(200, data, "Users retrieved successfully"));
});

const adminGetCustomers = asyncHandler(async (req, res) => {
  const data = await getUsers({ ...req.query, role: UserRolesEnum.CUSTOMER });

  return res
    .status(200)
    .json(new Apiresponse(200, data, "Customers retrieved successfully"));
});

const adminGetTurfOwners = asyncHandler(async (req, res) => {
  const data = await getUsers({ ...req.query, role: UserRolesEnum.TURF_OWNER });

  return res
    .status(200)
    .json(new Apiresponse(200, data, "Turf owners retrieved successfully"));
});

const adminGetUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new Apierror(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { user: buildUserPayload(user) },
        "User retrieved successfully",
      ),
    );
});

const adminUpdateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, phone, role, isEmailVerified } = req.body;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (isEmailVerified !== undefined) updates.isEmailVerified = isEmailVerified;

  if (role !== undefined) {
    if (![UserRolesEnum.CUSTOMER, UserRolesEnum.TURF_OWNER].includes(role)) {
      throw new Apierror(
        400,
        "Admin can only assign customer or turf_owner roles",
      );
    }
    updates.role = role;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!updatedUser) {
    throw new Apierror(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new Apiresponse(
        200,
        { user: buildUserPayload(updatedUser) },
        "User updated successfully",
      ),
    );
});

const adminDeleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    throw new Apierror(404, "User not found");
  }

  await User.findByIdAndDelete(userId);

  return res
    .status(200)
    .json(new Apiresponse(200, { deleted: true }, "User deleted successfully"));
});

const customerGetAllTurfs = turfController.getAllTurfs;
const customerGetSingleTurf = turfController.getSingleTurf;
const turfOwnerCreateTurf = turfController.createTurf;
const turfOwnerGetMyTurfs = turfController.getOwnerTurfs;
const turfOwnerUpdateTurf = turfController.updateTurf;
const turfOwnerDeleteTurf = turfController.deleteTurf;
const turfOwnerUploadImages = turfController.uploadTurfImages;

export {
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
};
