import express from "express";
import { 
  addProduct, 
  deleteProduct, 
  editProduct, 
  getAllProducts 
} from "../controllers/AdminController/productsController.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.post("/add", upload.array("images", 10), addProduct);
router.put("/edit/:id", upload.array("images", 10), editProduct);
router.delete("/delete/:id", deleteProduct);
router.get("/get", getAllProducts);

export default router;
