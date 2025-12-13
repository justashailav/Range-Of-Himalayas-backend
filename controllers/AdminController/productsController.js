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

    const files = req.files || [];

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    /* ------------------ VARIANTS ------------------ */
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch {
        parsedVariants = [];
      }
    }

    const allowedWeights = [
      "250g",
      "500g",
      "750g",
      "1kg",
      "2kg",
      "3kg",
      "5kg",
      "10kg",
      "12kg",
      "15kg",
    ];

    const normalizedVariants = parsedVariants
      .filter(v => v?.weight && allowedWeights.includes(v.weight))
      .map(v => ({
        size: v.size || "",
        weight: v.weight,
        stock: Number(v.stock) || 0,
        price: Number(v.price) || 0,
        salesPrice: Number(v.salesPrice) || 0,
      }));

    /* ------------------ NUTRITION ------------------ */
    let parsedNutrition = {};
    try {
      parsedNutrition = nutrition ? JSON.parse(nutrition) : {};
    } catch {}

    /* ------------------ DETAILS ------------------ */
    let parsedDetails = {};
    try {
      parsedDetails = details ? JSON.parse(details) : {};
    } catch {}

    /* ------------------ CUSTOM BOX ------------------ */
    let parsedCustomBoxPrices = [];
    try {
      parsedCustomBoxPrices = customBoxPrices
        ? JSON.parse(customBoxPrices)
        : [];
    } catch {}

    /* ------------------ BADGES ------------------ */
    let parsedBadges = ["Bestseller", "Organic"];
    try {
      parsedBadges = badges ? JSON.parse(badges) : parsedBadges;
    } catch {}

    /* ------------------ IMAGES ------------------ */
    const mainImage = await uploadMedia(files[0].path);
    const gallery = await Promise.all(
      files.slice(1).map(f => uploadMedia(f.path))
    );

    /* ------------------ SAVE ------------------ */
    const product = new Products({
      title,
      description,
      nutrition: parsedNutrition,
      details: parsedDetails,
      rating: Number(rating) || 0,
      reviewsCount: Number(reviewsCount) || 0,
      badges: parsedBadges,
      view360: view360 || "",
      variants: normalizedVariants,
      customBoxPrices: parsedCustomBoxPrices,
      image: mainImage.secure_url,
      images: gallery.map(i => i.secure_url),
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    // Sorting by createdAt (correct timestamp field)
    const products = await Products.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
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
      price: productPrice,
      salesPrice: productSalesPrice,
      stock: productStock,
    } = req.body;

    // Helper to safely parse field (returns {present, value})
    const safeParse = (field) => {
      if (typeof field === "undefined") return { present: false, value: undefined };
      if (field === null) return { present: true, value: null };
      if (typeof field === "string") {
        try {
          return { present: true, value: JSON.parse(field) };
        } catch {
          // If it's a plain string that isn't JSON, return the raw string (caller can decide)
          return { present: true, value: field };
        }
      }
      return { present: true, value: field };
    };

    // Parse fields
    const parsedVariantsObj = safeParse(variants);
    const parsedNutritionObj = safeParse(nutrition);
    const parsedDetailsObj = safeParse(details);
    const parsedCustomBoxPricesObj = safeParse(customBoxPrices);
    const parsedBadgesObj = safeParse(badges);

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
    let galleryImages = Array.isArray(product.images) ? [...product.images] : [];

    if (files.length > 0) {
      const uploaded = await Promise.all(files.map((f) => uploadMedia(f.path)));
      // first uploaded -> main (replace)
      mainImage = uploaded[0]?.secure_url || mainImage;
      // remaining uploaded -> append to existing gallery
      const newGallery = uploaded.slice(1).map((u) => u?.secure_url).filter(Boolean);
      galleryImages = galleryImages.concat(newGallery);
    }

    // Normalize variants if provided and is an array (or parses to array)
    let normalizedVariants;
    if (parsedVariantsObj.present) {
      let pv = parsedVariantsObj.value;
      if (typeof pv === "string") {
        // if client passed a non-json string, try comma separation -> unlikely for variants
        try {
          pv = JSON.parse(pv);
        } catch {
          pv = [];
        }
      }
      if (!Array.isArray(pv)) pv = [];
      normalizedVariants = pv.map((v) => ({
        size: v?.size || "",
        weight: v?.weight || "",
        stock: Number(v?.stock) || 0,
        price: Number(v?.price) || 0,
        salesPrice: Number(v?.salesPrice) || 0,
      }));
    }

    // Normalize custom box prices if provided
    let normalizedCustomBoxPrices;
    if (parsedCustomBoxPricesObj.present) {
      let pcb = parsedCustomBoxPricesObj.value;
      if (!Array.isArray(pcb)) pcb = [];
      normalizedCustomBoxPrices = pcb.map((p) => ({
        size: p?.size || "",
        pricePerPiece: Number(p?.pricePerPiece) || 0,
      }));
    }

    // Parse badges (accept array, JSON string or comma-separated string)
    let finalBadges;
    if (parsedBadgesObj.present) {
      let pb = parsedBadgesObj.value;
      if (typeof pb === "string") {
        // if JSON string was parsed to a string (i.e., not JSON), split by comma
        try {
          pb = JSON.parse(pb);
        } catch {
          pb = pb
            .split?.(",")
            .map((b) => b.trim())
            .filter(Boolean);
        }
      }
      if (!Array.isArray(pb)) pb = [];
      finalBadges = pb;
    }

    // Update only fields provided (keep previous values for fields not provided)
    if (typeof title !== "undefined") product.title = title || product.title;
    if (typeof description !== "undefined")
      product.description = description || product.description;

    if (parsedNutritionObj.present) {
      product.nutrition = parsedNutritionObj.value || {};
    }

    if (parsedDetailsObj.present) {
      product.details = parsedDetailsObj.value || {};
    }

    if (typeof rating !== "undefined") product.rating = Number(rating) || 0;
    if (typeof reviewsCount !== "undefined")
      product.reviewsCount = Number(reviewsCount) || 0;

    if (typeof finalBadges !== "undefined") product.badges = finalBadges;
    if (typeof view360 !== "undefined") product.view360 = view360 || product.view360;

    // If normalizedVariants was prepared (i.e., variants provided), set it; otherwise keep existing
    if (typeof normalizedVariants !== "undefined") {
      product.variants = normalizedVariants;
    }

    if (typeof normalizedCustomBoxPrices !== "undefined") {
      product.customBoxPrices = normalizedCustomBoxPrices;
    }

    // Update product-level price/stock if provided
    if (typeof productPrice !== "undefined") product.price = Number(productPrice) || 0;
    if (typeof productSalesPrice !== "undefined")
      product.salesPrice = Number(productSalesPrice) || 0;
    if (typeof productStock !== "undefined") product.stock = Number(productStock) || 0;

    // Images
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
      error: error.message,
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
