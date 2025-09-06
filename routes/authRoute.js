const express = require("express");
const {
  register,
  login,
  getMe,
  changePassword,
} = require("../controllrs/authController");
const { protect } = require("../middlewares/authMiddleware");
const { authLimiter } = require("../middlewares/rateLimiteMiddleware");
const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);

module.exports = router;
