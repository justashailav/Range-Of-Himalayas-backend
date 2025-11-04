import { uploadMedia } from "../config/cloudinary.js";
import Gallery from "../models/galleryModel.js";


export const createGalleryItem = async (req, res) => {
  try {
    const { category, title, desc } = req.body;
    const files = req.files; 

    if (!category || !title || !files || files.length === 0) {
      return res.status(400).json({ message: "Category, title & images are required" });
    }

    const uploadedImages = await Promise.all(
      files.map((file) => uploadMedia(file.path))
    );

    const imageUrls = uploadedImages.map((img) => img.secure_url);

    const newItem = new Gallery({
      category,
      title,
      desc,
      images: imageUrls,   
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to create item", error: error.message });
  }
};


export const getGalleryItems = async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch items", error: error.message });
  }
};


export const updateGalleryItem = async (req, res) => {
  try {
    const { category, title, desc } = req.body;
    const files = req.files;

    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map((file) => uploadMedia(file.path))
      );
      item.imageUrls = uploadedImages.map((img) => img.secure_url);
    }

    if (category) item.category = category;
    if (title) item.title = title;
    if (desc) item.desc = desc;

    const updatedItem = await item.save();
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to update item", error: error.message });
  }
};

export const getGalleryItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Gallery.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Gallery item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch item", error: error.message });
  }
};
export const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Gallery.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await Gallery.findByIdAndDelete(id);

    res.status(200).json({ message: "Gallery item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item", error: error.message });
  }
};
