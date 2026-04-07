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
      isCombo,
      comboNutrition,
      storeId,
      sku,
      status,
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
        parsedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch {
        parsedVariants = [];
      }
    }

    const allowedWeights = [
      "10g",
      "20g",
      "50g",
      "100g",
      "120g",
      "150g",
      "175g",
      "200g",
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
      "100ml",
      "200ml",
      "500ml",
      "1L",
      "500ml (Honey) 100ml (Apricot Oil)",
      "500ml (Honey) 200ml (Sea Buckthorn Pulp)",
      "500ml (Honey) 500ml (Sea Buckthorn Pulp)",
      "500ml (Honey) 10g (Himalayan Shilajit)",
      "500ml (Honey) 20g (Himalayan Shilajit)",
      "10g (Himalayan Shilajit) 500ml (Sea Buckthorn Pulp)",
      "10g (Himalayan Shilajit) 200ml (Sea Buckthorn Pulp)",
      "20g (Himalayan Shilajit) 200ml (Sea Buckthorn Pulp)",
      "20g (Himalayan Shilajit) 500ml (Sea Buckthorn Pulp)",
    ];

    const normalizedVariants = parsedVariants
      .filter((v) => v?.weight && allowedWeights.includes(v.weight))
      .map((v) => ({
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

    let parsedComboNutrition = [];

    try {
      parsedComboNutrition = comboNutrition
        ? typeof comboNutrition === "string"
          ? JSON.parse(comboNutrition)
          : comboNutrition
        : [];
    } catch {
      parsedComboNutrition = [];
    }
    // 🟢 VALIDATE COMBO
    const isComboBool = isCombo === "true" || isCombo === true;

    // ✅ CLEAN FIRST
    if (!isComboBool) {
      parsedComboNutrition = [];
    } else {
      parsedComboNutrition = parsedComboNutrition.filter(
        (item) => item.name && item.name.trim() !== "",
      );
    }

    // ✅ THEN VALIDATE
    if (isComboBool && parsedComboNutrition.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Combo must have at least one valid item",
      });
    }

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
      files.slice(1).map((f) => uploadMedia(f.path)),
    );

    /* ------------------ SAVE ------------------ */
    const product = new Products({
      title,
      description,
      isCombo: isCombo === "true" || isCombo === true,
      nutrition: parsedNutrition,
      comboNutrition: parsedComboNutrition,
      details: parsedDetails,
      rating: Number(rating) || 0,
      reviewsCount: Number(reviewsCount) || 0,
      badges: parsedBadges,
      view360: view360 || "",
      variants: normalizedVariants,
      customBoxPrices: parsedCustomBoxPrices,
      image: mainImage.secure_url,
      images: gallery.map((i) => i.secure_url),
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
      price,
      salesPrice,
      stock,
      isCombo,
      comboNutrition,
    } = req.body;

    // ---------------- FIND PRODUCT ----------------
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ---------------- SAFE PARSE HELPER ----------------
    const safeParse = (value, fallback) => {
      if (typeof value === "undefined") return undefined;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      }
      return value;
    };

    // ---------------- PARSE FIELDS ----------------
    const parsedNutrition = safeParse(nutrition, {});
    const parsedDetails = safeParse(details, {});
    const parsedVariants = safeParse(variants, []);
    const parsedCustomBoxPrices = safeParse(customBoxPrices, []);
    const parsedBadges = safeParse(badges, []);
    const parsedComboNutrition = safeParse(comboNutrition, { items: [] });

    // ---------------- IMAGE HANDLING ----------------
    const files = req.files || [];

    let mainImage = product.image;
    let galleryImages = [...(product.images || [])];

    if (files.length > 0) {
      const uploaded = await Promise.all(
        files.map((file) => uploadMedia(file.path)),
      );

      // First image replaces main image
      if (uploaded[0]?.secure_url) {
        mainImage = uploaded[0].secure_url;
      }

      // Rest go to gallery
      uploaded.slice(1).forEach((u) => {
        if (u?.secure_url) galleryImages.push(u.secure_url);
      });
    }

    // ---------------- NORMALIZE VARIANTS ----------------
    let normalizedVariants;
    if (Array.isArray(parsedVariants)) {
      normalizedVariants = parsedVariants.map((v) => ({
        size: v?.size || "", // OPTIONAL
        weight: v?.weight || "", // REQUIRED by schema
        stock: Number(v?.stock) || 0,
        price: Number(v?.price) || 0,
        salesPrice: Number(v?.salesPrice) || 0,
      }));
    }

    // ---------------- NORMALIZE CUSTOM BOX ----------------
    let normalizedCustomBoxPrices;
    if (Array.isArray(parsedCustomBoxPrices)) {
      normalizedCustomBoxPrices = parsedCustomBoxPrices.map((p) => ({
        size: p?.size || "",
        pricePerPiece: Number(p?.pricePerPiece) || 0,
      }));
    }

    // ---------------- BADGES ----------------
    let finalBadges;
    if (Array.isArray(parsedBadges)) {
      finalBadges = parsedBadges;
    } else if (typeof badges === "string") {
      finalBadges = badges
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);
    }

    // ---------------- UPDATE FIELDS (ONLY IF PROVIDED) ----------------
    if (typeof title !== "undefined") product.title = title;
    if (typeof description !== "undefined") product.description = description;
    if (typeof isCombo !== "undefined") {
      product.isCombo = isCombo === "true" || isCombo === true;
    }

    // 🟢 COMBO NUTRITION
    if (parsedComboNutrition !== undefined) {
      product.comboNutrition = parsedComboNutrition || { items: [] };
    }
    if (parsedNutrition !== undefined)
      product.nutrition = parsedNutrition || {};

    if (parsedDetails !== undefined) product.details = parsedDetails || {};

    if (typeof rating !== "undefined") product.rating = Number(rating) || 0;

    if (typeof reviewsCount !== "undefined")
      product.reviewsCount = Number(reviewsCount) || 0;

    if (typeof finalBadges !== "undefined") product.badges = finalBadges;

    if (typeof view360 !== "undefined") product.view360 = view360 || "";

    if (normalizedVariants !== undefined) product.variants = normalizedVariants;

    if (normalizedCustomBoxPrices !== undefined)
      product.customBoxPrices = normalizedCustomBoxPrices;

    if (typeof price !== "undefined") product.price = Number(price) || 0;

    if (typeof salesPrice !== "undefined")
      product.salesPrice = Number(salesPrice) || 0;

    if (typeof stock !== "undefined") product.stock = Number(stock) || 0;

    // ---------------- IMAGES ----------------
    product.image = mainImage;
    product.images = galleryImages;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Edit Product Error:", error);
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
