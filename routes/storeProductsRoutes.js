import express from "express";
import { addStoreProduct, copyToStore, deleteStoreProduct, editStoreProduct, getStoreProducts, restockProduct, sellStoreProduct } from "../controllers/storeProductsController.js";
const router = express.Router();
router.post("/add", addStoreProduct);
router.get("/products", getStoreProducts);
router.post("/copy", copyToStore);
router.post("/sell", sellStoreProduct);
router.post("/restock", restockProduct);
router.put("/edit/:id", editStoreProduct);
router.delete("/delete/:id", deleteStoreProduct);


export default router;