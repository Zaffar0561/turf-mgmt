import { Turf } from "../models/turf.model.js";
import { Apierror } from "../utils/api_error.js";
import { Apiresponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";

// CREATE TURF
export const createTurf = asyncHandler(async (req, res) => {
  const { name, description, city, location, pricePerHour, size, amenities } =
    req.body;
  // Prevent duplicate turf creation for the same owner + name
  const existing = await Turf.findOne({ owner: req.user._id, name });
  if (existing) {
    throw new Apierror(
      400,
      "Turf with this name already exists for this owner",
    );
  }

  const turf = new Turf({
    name,
    description,
    city,
    location,
    pricePerHour,
    size: size || "medium",
    amenities: amenities || [],
    owner: req.user._id,
  });

  try {
    const savedTurf = await turf.save();
    return res
      .status(201)
      .json(new Apiresponse(201, savedTurf, "Turf created successfully"));
  } catch (err) {
    // Handle duplicate key race condition (unique index violation)
    if (err && err.code === 11000) {
      throw new Apierror(
        400,
        "Turf with this name already exists for this owner",
      );
    }
    throw err;
  }
});

//GET OWNER'S TURFS
export const getOwnerTurfs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const turfs = await Turf.find({ owner: req.user._id })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Turf.countDocuments({ owner: req.user._id });

  return res.status(200).json(
    new Apiresponse(
      200,
      {
        turfs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Owner turfs retrieved successfully",
    ),
  );
});

//UPDATE TURF
export const updateTurf = asyncHandler(async (req, res) => {
  const { turfId } = req.params;

  const turf = await Turf.findById(turfId);
  if (!turf) {
    throw new Apierror(404, "Turf not found");
  }

  // Check if user is the owner
  if (turf.owner.toString() !== req.user._id.toString()) {
    throw new Apierror(403, "Only owner can update this turf");
  }

  // Update allowed fields
  const allowedUpdates = [
    "name",
    "description",
    "city",
    "location",
    "pricePerHour",
    "size",
    "amenities",
    "isAvailable",
  ];
  const updates = {};

  for (let field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const updatedTurf = await Turf.findByIdAndUpdate(turfId, updates, {
    new: true,
    runValidators: true,
  });

  return res
    .status(200)
    .json(new Apiresponse(200, updatedTurf, "Turf updated successfully"));
});

//DELETE TURF
export const deleteTurf = asyncHandler(async (req, res) => {
  const { turfId } = req.params;

  const turf = await Turf.findById(turfId);
  if (!turf) {
    throw new Apierror(404, "Turf not found");
  }

  // Check if user is the owner
  if (turf.owner.toString() !== req.user._id.toString()) {
    throw new Apierror(403, "Only owner can delete this turf");
  }

  await Turf.findByIdAndDelete(turfId);

  return res
    .status(200)
    .json(new Apiresponse(200, {}, "Turf deleted successfully"));
});

//UPLOAD TURF IMAGES
export const uploadTurfImages = asyncHandler(async (req, res) => {
  const { turfId } = req.params;

  if (!req.files || req.files.length === 0) {
    throw new Apierror(400, "No images provided");
  }

  const turf = await Turf.findById(turfId);
  if (!turf) {
    throw new Apierror(404, "Turf not found");
  }

  // Check if user is the owner
  if (turf.owner.toString() !== req.user._id.toString()) {
    throw new Apierror(403, "Only owner can upload images for this turf");
  }

  // Check image limit
  const newImageCount = turf.images.length + req.files.length;
  if (newImageCount > 5) {
    throw new Apierror(
      400,
      `Cannot upload more than 5 images total. Current: ${turf.images.length}, New: ${req.files.length}`,
    );
  }

  // Add new image paths
  const imagePaths = req.files.map((file) => file.path);
  turf.images.push(...imagePaths);

  const updatedTurf = await turf.save();

  return res
    .status(200)
    .json(new Apiresponse(200, updatedTurf, "Images uploaded successfully"));
});

//TURF FILTERS

//GET ALL TURFS WITH FILTERS
export const getAllTurfs = asyncHandler(async (req, res) => {
  const {
    city,
    size,
    minPrice,
    maxPrice,
    amenities,
    page = 1,
    limit = 10,
  } = req.query;

  // Build filter object
  const filter = { isAvailable: true };

  if (city) {
    filter.city = { $regex: city, $options: "i" }; // Case-insensitive search
  }

  if (size) {
    filter.size = size;
  }

  if (minPrice || maxPrice) {
    filter.pricePerHour = {};
    if (minPrice) filter.pricePerHour.$gte = parseInt(minPrice);
    if (maxPrice) filter.pricePerHour.$lte = parseInt(maxPrice);
  }

  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
    filter.amenities = { $in: amenitiesArray };
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const turfs = await Turf.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("owner", "name email phone")
    .sort({ createdAt: -1 });

  const total = await Turf.countDocuments(filter);

  return res.status(200).json(
    new Apiresponse(
      200,
      {
        turfs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        filters: {
          city: city || null,
          size: size || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
        },
      },
      "Turfs retrieved successfully",
    ),
  );
});

//GET SINGLE TURF
export const getSingleTurf = asyncHandler(async (req, res) => {
  const { turfId } = req.params;

  const turf = await Turf.findById(turfId).populate(
    "owner",
    "name email phone",
  );

  if (!turf) {
    throw new Apierror(404, "Turf not found");
  }

  return res
    .status(200)
    .json(new Apiresponse(200, turf, "Turf retrieved successfully"));
});
