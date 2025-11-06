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


export const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    console.log("🧠 [Auth Debug] Incoming request:", req.originalUrl);
    console.log("🧠 [Auth Debug] Cookies received:", req.cookies);
    console.log("🧠 [Auth Debug] Token found:", token ? "✅ Yes" : "❌ No");

    if (!token) {
      console.log("🚫 [Auth Debug] No token found in cookies");
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    let decoded;

    try {
      // Try verifying with user key first
      console.log("🧩 [Auth Debug] Verifying with JWT_SECRET_KEY...");
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      // If fails, it might be an admin token
      console.log("⚠️ [Auth Debug] Failed with JWT_SECRET_KEY, trying JWT_SECRET_KEY_LOGIN...");
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_LOGIN);
      } catch (e) {
        console.log("❌ [Auth Debug] Both verifications failed:", e.message);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }
    }

    console.log("✅ [Auth Debug] Token decoded:", decoded);

    // Handle Admin Login
    if (decoded.id === "admin-id" || decoded.role === "Admin") {
      console.log("👑 [Auth Debug] Admin access granted");
      req.user = {
        id: "admin-id",
        role: "Admin",
        email: process.env.ADMIN_EMAIL,
      };
      return next();
    }

    // Handle Regular User Login
    console.log("🔍 [Auth Debug] Fetching user from DB...");
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("🚫 [Auth Debug] No user found for ID:", decoded.id);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ [Auth Debug] Authenticated user:", user.email);
    req.user = user;

    next();
  } catch (error) {
    console.log("❌ [Auth Debug] Authentication failed:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication error",
      error: error.message,
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
