import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplate.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { uploadMedia } from "../config/cloudinary.js";
import jwt from "jsonwebtoken";
export const Register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }
    const user = await User.findOne({ email, accountVerified: true });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    const registrationAttemptsByUser = await User.find({
      email,
      accountVerified: false,
    });
    if (registrationAttemptsByUser.length >= 5) {
      return res.status(400).json({
        success: false,
        message:
          "You have exceeded registration attempts.Please contact support",
      });
    }
    if (password.length < 8 || password.length > 16) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 16 characters",
      });
    }
    const hasshedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hasshedPassword,
    });
    const verificationCode = await newUser.generateVerificatinCode();
    await newUser.save();
    sendVerificationCode(verificationCode, email, res);
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Failed to Register",
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email or OTP is missing",
      });
    }

    const userAllEntries = await User.find({
      email,
      accountVerified: false,
    }).sort({ createdAt: -1 });

    if (!userAllEntries || userAllEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    let user = userAllEntries[0];

    if (userAllEntries.length > 1) {
      await User.deleteMany({
        _id: { $ne: user._id },
        email,
        accountVerified: false,
      });
    }
    if (!user || user.verificationCode !== Number(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const currentTime = Date.now();
    const verificationCodeExpire = new Date(
      user.verificationCodeExpires
    ).getTime();

    if (currentTime > verificationCodeExpire) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, "Account verified", res);
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🧠 Login attempt:", email, password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    // ✅ ADMIN LOGIN
    if (email === ADMIN_EMAIL) {
      const isPasswordMatch = await bcrypt.compare(password, ADMIN_PASSWORD);
      if (!isPasswordMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin credentials",
        });
      }

      // 🔑 Admin token uses same secret as users for consistency
      const token = jwt.sign(
        { id: "admin-id", role: "Admin" },
        process.env.JWT_SECRET_KEY, // ✅ unified key
        { expiresIn: process.env.JWT_EXPIRE }
      );

      return res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
          maxAge: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
        })
        .json({
          success: true,
          message: "Admin login successful",
          token, // ✅ explicitly send token
          user: {
            id: "admin-id",
            email: ADMIN_EMAIL,
            role: "Admin",
          },
        });
    }

    // ✅ USER LOGIN
    const user = await User.findOne({ email, accountVerified: true });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exist or is not verified",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Uses same JWT_SECRET_KEY internally
    sendToken(user, 200, "User login successful", res);
  } catch (error) {
    console.error("💥 Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message,
    });
  }
};
export const ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, accountVerified: true });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validationBeforSave: false });
    const ResetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    console.log("Reset Password URL:", ResetPasswordUrl);
    const message = generateForgotPasswordEmailTemplate(ResetPasswordUrl);

    await sendEmail({
      email: user.email,
      subject: "Range Of Himalayas Password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email send to ${user.email} successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Failed to send email",
    });
  }
};

export const ResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("Token", token);
    console.log("Request Body:", req.body);

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    console.log("Hashed Token:", resetPasswordToken);
    console.log("User Found:", user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset Password token is invalid or expired",
      });
    }
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password & confrirm Password do not match",
      });
    }
    if (
      req.body.password.length < 8 ||
      req.body.password.length > 16 ||
      req.body.confirmPassword.length < 8 ||
      req.body.confirmPassword.length > 16
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 16 characters",
      });
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    sendToken(user, 200, "Password Reset send successfully", res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed Password Reset",
    });
  }
};

export const UpdatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }
    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Current Password is incorrect",
      });
    }
    if (
      newPassword.length < 8 ||
      newPassword.length > 16 ||
      confirmNewPassword.length < 8 ||
      confirmNewPassword.length > 16
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 16 characters",
      });
    }
    if (newPassword != confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm new password do not match",
      });
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    (user.password = hashPassword), await user.save();
    res.status(200).json({
      success: true,
      message: "Password updated",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update password",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, gender, dateOfBirth } = req.body;
    const id = req.user._id.toString();
    const profilePhoto = req.file;
    console.log("ProfilePhoto",profilePhoto)
    console.log("Profile id", id);
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    if (profilePhoto) {
      const uploadResult = await uploadMedia(profilePhoto.path);
      user.profile.profilePhoto = uploadResult.secure_url || uploadResult;
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.profile.phone = phone;
    if (gender) user.profile.gender = gender;
    if (dateOfBirth) user.profile.dateOfBirth = new Date(dateOfBirth);

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Profile update failed.",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

export const Logout = async (req, res) => {
  try {
    res
      .cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production", 
        sameSite: "strict",
      })
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};
