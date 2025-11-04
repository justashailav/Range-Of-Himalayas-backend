import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config({});
cloudinary.config({
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  cloud_name: process.env.CLOUD_NAME,
});

export const uploadMedia = async (file) => {
  try {
    const res = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
    return res;
  } catch (error) {
    console.log(error);
  }
};


