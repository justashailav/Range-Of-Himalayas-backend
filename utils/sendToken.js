export const sendToken = (user, statusCode, message, res) => {
  // Generate JWT token from user model method
  const token = user.generateToken();

  // Calculate cookie expiration date
  const cookieExpireDays = process.env.COOKIE_EXPIRE || 3;
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ only send over HTTPS in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // ✅ allows cross-site cookie (Render + Netlify)
  };

  // Send response
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      message,
      user,
      token, // ✅ include token explicitly
    });
};
