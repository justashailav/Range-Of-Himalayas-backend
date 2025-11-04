import express from "express"
import { ForgotPassword, getUserById, Login, Logout, Register, ResetPassword, UpdatePassword, updateProfile, verifyOTP } from "../controllers/userController.js";
import { isAuthenticated, isAuthorized } from "../middleware/authmiddleware.js";
import upload from "../utils/multer.js";
const router =express.Router()

router.post("/register",Register);
router.post("/verify-otp",verifyOTP);
router.post("/login",Login);
router.post("/password/forgot",ForgotPassword);
router.put("/password/reset/:token",ResetPassword);
router.put("/password/update",isAuthenticated,UpdatePassword);
router.put("/update-profile",isAuthenticated,upload.single("profilePhoto"),updateProfile);
router.get("/logout", isAuthenticated, Logout);
router.get("/:id", getUserById);
router.get("/admin/dashboard",isAuthenticated,isAuthorized("Admin"),(req, res) => {res.json({ success: true, message: "Welcome Admin!" });});
export default router;