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
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }

  try {
    let decoded;

    // Try verifying with user secret first
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      // If it fails, try admin secret
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_LOGIN);
    }

    if (decoded.id === "admin-id" || decoded.role === "Admin") {
      req.user = {
        id: "admin-id",
        role: "Admin",
        email: process.env.ADMIN_EMAIL,
      };
    } else {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }
      req.user = user;
    }

    next();
  } catch (error) {
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
