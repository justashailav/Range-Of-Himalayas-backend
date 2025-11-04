import express from "express";
import {
  createGalleryItem,
  getGalleryItems,
  getGalleryItemById,   
  updateGalleryItem,
  deleteGalleryItem,
} from "../controllers/galleryController.js";
import upload from "../utils/multer.js";

const router = express.Router();


router.post("/add", upload.array("images", 10), createGalleryItem);
router.get("/get", getGalleryItems);
router.get("/:id", getGalleryItemById);
router.put("/edit/:id", upload.array("images", 10), updateGalleryItem);
router.delete("/delete/:id", deleteGalleryItem);

export default router;
