import { Coupon } from "../../models/AdminModel/couponModal.js";
import { Order } from "../../models/Order.js";

export const applyCoupon = async (req, res) => {
  try {
    
    const { code, orderAmount, userId } = req.body;

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ success: false, message: "Coupon is inactive" });
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minOrderAmount}`,
      });
    }
    if (coupon.maxUniqueUsers && coupon.maxUniqueUsers > 0) {
      const uniqueUsers = await Order.distinct("userId", { code: coupon._id });
      if (
        uniqueUsers.length >= coupon.maxUniqueUsers &&
        !uniqueUsers.includes(userId)
      ) {
        return res.status(400).json({
          success: false,
          message: `This coupon was limited to the first ${coupon.maxUniqueUsers} users`,
        });
      }
    }
    const userUsedCount = await Order.countDocuments({
      userId,
      code: coupon._id,
    });

    if (userUsedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "You have already used this coupon the maximum number of times",
      });
    }
    let discountAmount =
      coupon.discountType === "percentage"
        ? (orderAmount * coupon.discountValue) / 100
        : coupon.discountValue;

    const finalPrice = Math.max(orderAmount - discountAmount, 0);

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discountAmount,
      finalPrice,
      code: coupon.code,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error applying coupon",
      error: error.message,
    });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
      expiresAt,
      maxUniqueUsers,
    } = req.body;

    const formattedCode = code.toUpperCase().trim();

    const existing = await Coupon.findOne({ code: formattedCode });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }
    const coupon = await Coupon.create({
      code: formattedCode,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
      expiresAt,
      maxUniqueUsers: maxUniqueUsers || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error. Try again later.",
    });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch coupons." });
  }
};
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Coupon.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    return res.status(200).json({ success: true, message: "Coupon deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete coupon." });
  }
};

export const editCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
      expiresAt,
      isActive,
    } = req.body;
    const existingCoupon = await Coupon.findById(id);
    if (!existingCoupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }
    if (code && code.toUpperCase().trim() !== existingCoupon.code) {
      const codeExists = await Coupon.findOne({
        code: code.toUpperCase().trim(),
        _id: { $ne: id },
      });
      if (codeExists) {
        return res.status(400).json({ message: "Coupon code already exists." });
      }
    }

    existingCoupon.code = code ? code.toUpperCase().trim() : existingCoupon.code;
    existingCoupon.discountType = discountType ?? existingCoupon.discountType;
    existingCoupon.discountValue = discountValue ?? existingCoupon.discountValue;
    existingCoupon.minOrderAmount = minOrderAmount ?? existingCoupon.minOrderAmount;
    existingCoupon.usageLimit = usageLimit ?? existingCoupon.usageLimit;
    existingCoupon.expiresAt = expiresAt ?? existingCoupon.expiresAt;
    if (typeof isActive === "boolean") {
      existingCoupon.isActive = isActive;
    }

    await existingCoupon.save();

    return res.status(200).json({ success: true, coupon: existingCoupon, message: "Coupon updated successfully." });
  } catch (error) {
    console.error("Error editing coupon:", error);
    return res.status(500).json({ message: "Server error. Try again later." });
  }
};
