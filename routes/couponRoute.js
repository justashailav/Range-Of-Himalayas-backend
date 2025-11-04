import express from "express"
import { applyCoupon, createCoupon, deleteCoupon, editCoupon, getAllCoupons} from "../controllers/AdminController/couponController.js";
import { isAuthenticated } from "../middleware/authmiddleware.js";
const router =express.Router()

router.post("/create-coupon" ,createCoupon);
router.post("/apply-coupon",isAuthenticated,applyCoupon);
router.get("/get-coupons",getAllCoupons);
router.delete("/:id",deleteCoupon);
// router.put("/toggle/:id", toggleCouponStatus);
router.put("/edit-coupon/:id",editCoupon)
export default router;