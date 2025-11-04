import express from "express"
import { addBoxToCart, addToCart, deleteBoxFromCart, deleteCartItem, fetchCartItems, updateCartItemQty } from "../controllers/cartController.js";
const router =express.Router()

router.post("/add",addToCart);
router.get("/get/:userId",fetchCartItems);
router.put("/update-cart",updateCartItemQty);
router.delete("/:userId/:productId",deleteCartItem);
router.post("/add-box", addBoxToCart);
router.post("/delete-box", deleteBoxFromCart);
export default router;