import { Products } from "../models/AdminModel/productsModel.js";
import { StoreProduct } from "../models/storeProductsModel.js";


/* ---------------- HELPER ---------------- */
const getStoreId = (req) => {
  if (req.user.role === "Admin") {
    return req.query.storeId; 
  }
  return req.storeId; // manager
};

export const addStoreProduct = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can add products",
      });
    }

    const {
      title,
      displayName,
      description,
      variants,
      category,
      image,
      searchKeywords,
      lowStockThreshold,
      status,
      isAvailable
    } = req.body;

    const storeId = req.storeId;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title required",
      });
    }

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

    const stockLogs = normalizedVariants
      .filter((v) => v.stock > 0)
      .map((v) => ({
        type: "restock",
        quantity: v.stock,
        note: "Initial stock added",
      }));

    const keywordsArray =
      typeof searchKeywords === "string"
        ? searchKeywords.split(",").map((k) => k.trim().toLowerCase())
        : searchKeywords || [];

    const product = await StoreProduct.create({
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

    res.status(201).json({
      success: true,
      message: "Product added",
      product,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- GET PRODUCTS (ADMIN + MANAGER) ---------------- */
export const getStoreProducts = async (req, res) => {
  try {
    const storeId = getStoreId(req);

    const filter = { isDeleted: false };
    if (storeId) filter.storeId = storeId;

    const products = await StoreProduct.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, products });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- COPY PRODUCT (MANAGER ONLY) ---------------- */
export const copyToStore = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { productId } = req.body;
    const storeId = req.storeId;

    const product = await Products.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newProduct = await StoreProduct.create({
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

    res.json({ success: true, product: newProduct });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- SELL (MANAGER ONLY) ---------------- */
export const sellStoreProduct = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { sku, quantity } = req.body;

    const product = await StoreProduct.findOne({
      storeId: req.storeId,
      "variants.sku": sku,
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.find((v) => v.sku === sku);

    if (!variant || variant.stock < quantity) {
      return res.status(400).json({ message: "Out of stock" });
    }

    const sellingPrice = variant.salesPrice || variant.price;

    variant.stock -= quantity;
    product.totalStock -= quantity;
    product.sold += quantity;

    product.stockLogs.push({
      type: "sale",
      quantity,
      note: "Sold by manager",
    });

    await product.save();

    res.json({
      success: true,
      revenue: sellingPrice * quantity,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ---------------- RESTOCK (MANAGER ONLY) ---------------- */
export const restockProduct = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { sku, quantity } = req.body;

    const product = await StoreProduct.findOne({
      storeId: req.storeId,
      "variants.sku": sku,
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.find((v) => v.sku === sku);

    variant.stock += quantity;
    product.totalStock += quantity;

    product.stockLogs.push({
      type: "restock",
      quantity,
      note: "Manager restock",
    });

    await product.save();

    res.json({
      success: true,
      message: "Stock updated",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- EDIT (MANAGER ONLY) ---------------- */
export const editStoreProduct = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { id } = req.params;

    const product = await StoreProduct.findOneAndUpdate(
      { _id: id, storeId: req.storeId },
      req.body,
      { new: true }
    );

    res.json({ success: true, product });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- DELETE (MANAGER ONLY) ---------------- */
export const deleteStoreProduct = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { id } = req.params;

    await StoreProduct.findOneAndUpdate(
      { _id: id, storeId: req.storeId },
      { isDeleted: true }
    );

    res.json({
      success: true,
      message: "Product deleted",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};