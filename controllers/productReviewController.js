// import { Products } from "../models/AdminModel/productsModel.js";
// import { Order } from "../models/Order.js";
// import { Review } from "../models/ReviewModel.js";

// export const addProductReview = async (req, res) => {
//   try {
//     const { productId, userId, userName, reviewMessage, reviewValue } = req.body;
//     console.log(productId,userId,userName,reviewMessage,reviewValue)
//     const order = await Order.findOne({
//       userId,
//       "cartItems.productId": productId,
//     });

//     if (!order) {
//       return res.status(403).json({
//         success: false,
//         message: "You need to purchase the product to review it.",
//       });
//     }

//     const existingReview = await Review.findOne({ productId, userId });
//     if (existingReview) {
//       return res.status(400).json({
//         success: false,
//         message: "You already reviewed this product!",
//       });
//     }
//     const reviewImages = req.files?.map(file => file.path) || [];

//     const newReview = new Review({
//       productId,
//       userId,
//       userName,
//       reviewMessage,
//       reviewValue,
//       reviewImages, 
//     });

//     await newReview.save();

//     const reviews = await Review.find({ productId });
//     const totalReviewsLength = reviews.length;
//     const averageReview =
//       reviews.reduce((sum, r) => sum + r.reviewValue, 0) / totalReviewsLength;

//     await Products.findByIdAndUpdate(productId, { averageReview });

//     res.status(201).json({
//       success: true,
//       data: newReview,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// export const getProductReviews = async (req, res) => {
//   try {
//     const { productId } = req.params;

//     const reviews = await Review.find({ productId });
//     res.status(200).json({
//       success: true,
//       data: reviews,
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Error",
//     });
//   }
// };

// export const getAllReviews = async (req, res) => {
//   try {
//     // Fetch all reviews, optionally populate product info if needed
//     const reviews = await Review.find()
//       .sort({ createdAt: -1 }) // latest reviews first
//       .populate('productId', 'title averageReview'); // optional: get product name & avg rating

//     res.status(200).json({
//       success: true,
//       data: reviews,
//     });
//   } catch (error) {
//     console.error("Error fetching all reviews:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };


import mongoose from "mongoose";
import { Products } from "../models/AdminModel/productsModel.js";
import { Order } from "../models/Order.js";
import { Review } from "../models/ReviewModel.js";

/**
 * Add a Product Review
 */
export const addProductReview = async (req, res) => {
  try {
    const { productId, userId, userName, reviewMessage, reviewValue } = req.body;

    if (!productId || !userId || !userName || !reviewMessage || !reviewValue) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Convert IDs to ObjectId (very important)
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ✅ Check if user has purchased this product
    const order = await Order.findOne({
      userId: userObjectId,
      "cartItems.productId": productObjectId,
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You need to purchase the product to review it.",
      });
    }

    // ✅ Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: productObjectId,
      userId: userObjectId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product!",
      });
    }

    // ✅ Handle uploaded images (if any)
    const reviewImages = req.files?.map((file) => file.path) || [];

    // ✅ Create and save review
    const newReview = new Review({
      productId: productObjectId,
      userId: userObjectId,
      userName,
      reviewMessage,
      reviewValue,
      reviewImages,
    });

    await newReview.save();

    // ✅ Update product’s average rating
    const allReviews = await Review.find({ productId: productObjectId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.reviewValue, 0) /
      allReviews.length;

    await Products.findByIdAndUpdate(productObjectId, {
      averageReview: avgRating,
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: newReview,
    });
  } catch (e) {
    console.error("Error adding review:", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get Reviews for a Specific Product
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const reviews = await Review.find({ productId: productObjectId })
      .sort({ createdAt: -1 })
      .populate("productId", "title averageReview");

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    console.error("Error fetching product reviews:", e);
    res.status(500).json({
      success: false,
      message: "Error fetching product reviews",
    });
  }
};

/**
 * Get All Reviews (Admin or Global View)
 */
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate("productId", "title averageReview");

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
