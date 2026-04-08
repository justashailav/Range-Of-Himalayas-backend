export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();


  res
    .status(statusCode)
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ✅ Important for localhost vs Netlify
      maxAge: parseInt(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      user,
      message,
      token, // optional, for debugging
    });
};
