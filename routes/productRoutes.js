import express from "express"
import { getProductDetails } from "../controllers/product-controller.js";
const router =express.Router()
router.get("/get-details/:id",getProductDetails);

export default router;