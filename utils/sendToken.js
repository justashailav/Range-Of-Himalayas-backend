export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();

  res
    .status(statusCode)
    .cookie("token", token, {
      httpOnly: true,
      secure: true,          // 🔥 FORCE TRUE (important)
      sameSite: "none",      // 🔥 FORCE NONE (important)
      maxAge: parseInt(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      user,
      message,
      token,
    });
};