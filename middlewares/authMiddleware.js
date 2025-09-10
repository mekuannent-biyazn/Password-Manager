const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "User not found" });
      req.user = user;
      return next();
    }
    return res.status(401).json({ message: "Not authorized, no token" });
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
}

// Require one of the roles
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    next();
  };
}

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Admin only route");
  }
};

module.exports = { protect, requireRoles, admin };
