import mongoose, { Schema } from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Turf name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location/Address is required"],
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: [0, "Price cannot be negative"],
    },
    size: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },

    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: "Maximum 5 images allowed",
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

turfSchema.index({ owner: 1, name: 1 }, { unique: true });

export const Turf = mongoose.model("Turf", turfSchema, "turf");
