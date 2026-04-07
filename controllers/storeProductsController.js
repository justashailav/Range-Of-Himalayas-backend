import { StoreProduct } from "../models/storeProductsModel.js";



/* ---------------- ADD STORE PRODUCT ---------------- */
export const addStoreProduct = async (req, res) => {
  try {
    const {
      title,
      displayName,
      description,
      storeId,
      variants,
      category,
      image,
      searchKeywords,
      lowStockThreshold,
      status,
      isAvailable
    } = req.body;

    // ✅ Validation
    if (!title || !storeId) {
      return res.status(400).json({
        success: false,
        message: "Title and storeId required",
      });
    }

    // ✅ Parse variants safely
    const parsedVariants =
      typeof variants === "string" ? JSON.parse(variants) : variants;

    const normalizedVariants = (parsedVariants || []).map((v) => ({
      size: v.size || "",
      weight: v.weight || "",
      sku: v.sku || "",
      barcode: v.barcode || "",
      stock: Number(v.stock) || 0,
      price: Number(v.price) || 0,
      salesPrice: Number(v.salesPrice) || 0,
      costPrice: Number(v.costPrice) || 0,
    }));

    // ✅ Generate initial stock logs (optional but powerful)
    const stockLogs = [];
    normalizedVariants.forEach((v) => {
      if (v.stock > 0) {
        stockLogs.push({
          type: "restock",
          quantity: v.stock,
          note: "Initial stock added",
        });
      }
    });

    // ✅ Normalize keywords
    const keywordsArray =
      typeof searchKeywords === "string"
        ? searchKeywords.split(",").map((k) => k.trim().toLowerCase())
        : searchKeywords || [];

    // ✅ Create product
    const product = new StoreProduct({
      title,
      displayName: displayName || "",
      description: description || "",
      storeId,
      category: category || "",
      image: image || "",
      searchKeywords: keywordsArray,
      variants: normalizedVariants,
      stockLogs,
      lowStockThreshold: lowStockThreshold || 5,
      status: status || "active",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Store product created successfully",
      product,
    });

  } catch (err) {
    console.error("❌ Add Store Product Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getStoreProducts = async (req, res) => {
  try {
    const { storeId } = req.query;

    const filter = { isDeleted: false };

    if (storeId) filter.storeId = storeId;

    const products = await StoreProduct.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const copyToStore = async (req, res) => {
  try {
    const { productId, storeId } = req.body;

    const product = await Products.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newProduct = new StoreProduct({
      title: product.title,
      description: product.description,
      image: product.image,
      storeId,

      variants: product.variants.map((v) => ({
        size: v.size,
        weight: v.weight,
        sku: v.sku || "",
        stock: 0,
        price: v.price,
        salesPrice: v.salesPrice,
        costPrice: 0,
      })),
    });

    await newProduct.save();

    res.json({
      success: true,
      message: "Product copied to store",
      product: newProduct,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const sellStoreProduct = async (req, res) => {
  try {
    const { sku, quantity } = req.body;

    if (!sku || !quantity) {
      return res.status(400).json({
        success: false,
        message: "SKU and quantity required",
      });
    }

    const product = await StoreProduct.findOne({
      "variants.sku": sku,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.variants.find(v => v.sku === sku);

    if (!variant || variant.stock < quantity) {
      return res.status(400).json({ message: "Out of stock" });
    }

    const sellingPrice = variant.salesPrice || variant.price;

    await StoreProduct.updateOne(
      { "variants.sku": sku },
      {
        $inc: {
          "variants.$.stock": -quantity,
          totalStock: -quantity,
          sold: quantity,
        },
        $push: {
          stockLogs: {
            type: "sale",
            quantity,
            note: "Sold from store",
          },
        },
      }
    );

    res.json({
      success: true,
      revenue: sellingPrice * quantity,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const restockProduct = async (req, res) => {
  try {
    const { sku, quantity } = req.body;

    await StoreProduct.updateOne(
      { "variants.sku": sku },
      {
        $inc: {
          "variants.$.stock": quantity,
          totalStock: quantity,
        },
        $push: {
          stockLogs: {
            type: "restock",
            quantity,
            note: "Manual restock",
          },
        },
      }
    );

    res.json({
      success: true,
      message: "Stock updated",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const editStoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await StoreProduct.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      product,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const deleteStoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await StoreProduct.findByIdAndUpdate(id, {
      isDeleted: true,
    });

    res.json({
      success: true,
      message: "Product deleted",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};