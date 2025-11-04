import express from "express"
import { addToWishList, deleteWishListItem, fetchWishListItems, updateWishListItemQty } from "../controllers/wishListController.js";
const router =express.Router()

router.post("/add-wishlist",addToWishList);
router.get("/get-wishlist/:userId",fetchWishListItems);
router.put("/update-wishlist",updateWishListItemQty);
router.delete("/wishlist/:userId/:productId",deleteWishListItem);

export default router;