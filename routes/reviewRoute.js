import express from "express"
import { addProductReview, getAllReviews, getProductReviews } from "../controllers/productReviewController.js";
import upload from "../utils/multer.js";
import { isAuthenticated } from "../middleware/authmiddleware.js";
const router =express.Router()
router.post("/add-review",isAuthenticated, upload.array("reviewImages", 5),addProductReview);
router.get("/get-review/:productId",getProductReviews)
router.get("/get-all-reviews", getAllReviews);
export default router