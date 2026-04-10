import express from "express";
import {
  addStoreProduct,
  copyToStore,
  deleteStoreProduct,
  editStoreProduct,
  getStoreProducts,
  restockProduct,
  sellStoreProduct
} from "../controllers/storeProductsController.js";

import {
  attachStore,
  isAuthenticated,
  isAuthorized
} from "../middleware/authmiddleware.js";

const router = express.Router();

router.use("/manager", isAuthenticated, attachStore);

router.post("/manager/add", addStoreProduct);
router.get("/manager/products", getStoreProducts);
router.post("/manager/copy", copyToStore);
router.post("/manager/sell", sellStoreProduct);
router.post("/manager/restock", restockProduct);
router.put("/manager/edit/:id", editStoreProduct);
router.delete("/manager/delete/:id", deleteStoreProduct);

/* ---------------- ADMIN ROUTES ---------------- */
router.use("/admin", isAuthenticated, isAuthorized("Admin"));

router.get("/admin/products", getStoreProducts); // 👀 view only


export default router