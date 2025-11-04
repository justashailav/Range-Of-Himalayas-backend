import { uploadMedia } from "../../config/cloudinary.js";
import { Products } from "../../models/AdminModel/productsModel.js";

export const addProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      nutrition,
      details,
      rating,
      reviewsCount,
      badges,
      view360,
      variants,
      customBoxPrices, 
    } = req.body;

    const allFiles = req.files || [];

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (allFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }
    const mainImage = allFiles[0];
    const galleryImages = allFiles.slice(1);
    let parsedVariants = variants;
    if (typeof variants === "string") {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON in variants field",
        });
      }
    }

    let parsedNutrition = nutrition;
    if (typeof nutrition === "string") {
      try {
        parsedNutrition = JSON.parse(nutrition);
      } catch {
        parsedNutrition = {};
      }
    }

    let parsedDetails = details;
    if (typeof details === "string") {
      try {
        parsedDetails = JSON.parse(details);
      } catch {
        parsedDetails = {};
      }
    }

    let parsedCustomBoxPrices = customBoxPrices;
    if (typeof customBoxPrices === "string") {
      try {
        parsedCustomBoxPrices = JSON.parse(customBoxPrices);
      } catch {
        parsedCustomBoxPrices = [];
      }
    }

    // Normalize variants
    const normalizedVariants = (parsedVariants || []).map((v) => ({
      size: v.size,
      weight: v.weight,
      stock: Number(v.stock) || 0,
      price: Number(v.price) || 0,
      salesPrice: v.salesPrice ? Number(v.salesPrice) : 0,
    }));

    // Normalize custom box prices
    const normalizedCustomBoxPrices = (parsedCustomBoxPrices || []).map((p) => ({
      size: p.size,
      pricePerPiece: Number(p.pricePerPiece) || 0,
    }));

    // Upload main image
    const uploadedMain = await uploadMedia(mainImage.path);

    // Upload gallery images
    const uploadedGallery = await Promise.all(
      galleryImages.map((file) => uploadMedia(file.path))
    );

    // Create new product
    const newProduct = new Products({
      title,
      description,
      nutrition: parsedNutrition || {},
      details: parsedDetails || {},
      rating: rating || 0,
      reviewsCount: reviewsCount || 0,
      badges: badges || ["Bestseller", "Organic"],
      view360: view360 || "",
      variants: normalizedVariants,
      customBoxPrices: normalizedCustomBoxPrices, // ✅ save custom box prices
      image: uploadedMain.secure_url,
      images: uploadedGallery.map((img) => img.secure_url),
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add product",
    });
  }
};




export const getAllProducts = async (req, res) => {
  try {
    const products = await Products.find().sort({ created: -1 });
    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      title,
      description,
      nutrition,
      details,
      rating,
      reviewsCount,
      badges,
      view360,
      variants,
      customBoxPrices,
    } = req.body;

    // Parse JSON fields safely
    const parseField = (field, fallback) => {
      if (!field) return fallback;
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch {
          return fallback;
        }
      }
      return field;
    };

    const parsedVariants = parseField(variants, []);
    const parsedNutrition = parseField(nutrition, {});
    const parsedDetails = parseField(details, {});
    const parsedCustomBoxPrices = parseField(customBoxPrices, []);

    // Find existing product
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Upload new images if any
    const files = req.files || [];
    let mainImage = product.image;
    let galleryImages = product.images || [];

    if (files.length > 0) {
      const uploaded = await Promise.all(files.map((f) => uploadMedia(f.path)));
      // first image = main, rest = gallery
      mainImage = uploaded[0]?.secure_url || mainImage;
      galleryImages = uploaded.slice(1).map((img) => img.secure_url);
    }

    // Normalize variants
    const normalizedVariants = (parsedVariants || []).map((v) => ({
      size: v.size,
      weight: v.weight,
      stock: Number(v.stock) || 0,
      price: Number(v.price) || 0,
      salesPrice: Number(v.salesPrice) || 0,
    }));

    const normalizedCustomBoxPrices = (parsedCustomBoxPrices || []).map((p) => ({
      size: p.size,
      pricePerPiece: Number(p.pricePerPiece) || 0,
    }));

    // Update product fields
    product.title = title || product.title;
    product.description = description || product.description;
    product.nutrition = parsedNutrition;
    product.details = parsedDetails;
    product.rating = rating || product.rating;
    product.reviewsCount = reviewsCount || product.reviewsCount;
    product.badges = badges || product.badges;
    product.view360 = view360 || product.view360;
    product.variants = normalizedVariants;
    product.customBoxPrices = normalizedCustomBoxPrices;
    product.image = mainImage;
    product.images = galleryImages;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to edit product",
    });
  }
};



export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const product = await Products.findByIdAndDelete(id);

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      id: product._id,
    });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete Product",
    });
  }
};
