export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();

  res
    .status(statusCode)
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: parseInt(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,          // ✅ FIXED
        email: user.email,
        role: user.role,       // ✅ IMPORTANT
      },
    });
};