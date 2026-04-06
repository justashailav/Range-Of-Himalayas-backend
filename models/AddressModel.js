import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  userId: String,

  address: String,
  city: String,
  pincode: String,
  phone: String,
  notes: String,

  // 🔥 ADD THIS
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [0, 0]
    }
  }

}, { timestamps: true });

export const Address = mongoose.model("Address", addressSchema);