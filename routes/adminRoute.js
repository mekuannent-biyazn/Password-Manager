const express = require("express");
const { protect, requireRoles } = require("../middlewares/authMiddleware");
const admin = require("../controllrs/adminController");
const ctrl = require("../controllrs/vaultController");

const router = express.Router();

router.use(protect, requireRoles("admin"));

router.get("/users", admin.listUsers);
router.get("/items", ctrl.listItems);
router.post("/set-role", admin.setRole);
router.delete("/users/:userId", admin.deleteUser);

module.exports = router;
