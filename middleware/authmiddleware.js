// import jwt from "jsonwebtoken";
// import { User } from "../models/userModel.js";
// export const isAuthenticated = async (req, res, next) => {
//   const { token } = req.cookies;
//   if (!token) {
//     return res.status(400).json({
//       success: false,
//       message: "User not authenciated",
//     });
//   }
//   const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//   console.log(decoded);
//   req.user = await User.findById(decoded.id);
//   next();
// };

// export const isAuthorized = (...roles) => {
//   return (req, re, next) => {
//     if (!roles.includes(req.user.role)) {
//       return next({
//         status: 403,
//         message: "You are not authorized to access this resource.",
//       });
//     }
//     next()
//   };
// };
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    console.log("🍪 [Auth Debug] Cookies:", req.cookies);

    if (!token) {
      console.log("🚫 No token found");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("✅ Token verified:", decoded);

    // Admin login (special static case)
    if (decoded.id === "admin-id" || decoded.role === "Admin") {
      req.user = {
        id: "admin-id",
        role: "Admin",
        email: process.env.ADMIN_EMAIL,
      };
      console.log("👑 Admin authenticated");
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
