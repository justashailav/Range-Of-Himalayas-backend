import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      console.log("No token found");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    if (decoded.id === "admin-id" || decoded.role === "Admin") {
      req.user = {
        id: "admin-id",
        role: "Admin",
        email: process.env.ADMIN_EMAIL,
      };
      console.log("Admin authenticated");
      return next();
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("🚫 No user found for:", decoded.id);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    console.log("✅ Authenticated user:", user.email);
    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};


export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource.",
      });
    }
    next();
  };
};

export const attachStore = (req, res, next) => {
  try {
    if (req.user.role === "Admin") {
      return next();
    }
    if (req.user.role === "Manager") {
      if (!req.user.storeId) {
        return res.status(400).json({
          success: false,
          message: "Manager not assigned to any store",
        });
      }

      req.storeId = req.user.storeId;
      return next();
    }
    return res.status(403).json({ 
      success: false,
      message: "Only managers can access store data",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
