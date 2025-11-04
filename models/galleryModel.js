import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["Orchard", "Harvesting", "Products", "Farm"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String, 
        required: true,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", gallerySchema);
