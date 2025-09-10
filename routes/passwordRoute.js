const express = require("express");
const { protect, admin } = require("../middlewares/authMiddleware");
const controller = require("../controllrs/passwordController");

const router = express.Router();

// all require auth
router.use(protect);

router.get("/admin/all", admin, controller.getAllVaultItems);
router.put("/admin/:id", admin, controller.updateAnyVaultItem);
router.delete("/admin/:id", admin, controller.deleteAnyVaultItem);

router.post("/", controller.createItem);
router.get("/", controller.listItems);
router.get("/export", controller.exportAll);
router.get("/:id", controller.getItem);
router.patch("/:id", controller.updateItem);
router.delete("/:id", controller.deleteItem);

module.exports = router;
