const express = require("express");
const {
  register,
  login,
  getMe,
  changePassword,
  verifyOTP,
  resendOTP,
  logout,
  googleAuth,
} = require("../controllrs/authController");
const { protect } = require("../middlewares/authMiddleware");
const { authLimiter } = require("../middlewares/rateLimiteMiddleware");
const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/logout", protect, logout);

router.post("/google", googleAuth); // expects { idToken }

module.exports = router;
