const express = require("express");
const { protect, admin } = require("../middlewares/authMiddleware");
const ctrl = require("../controllrs/vaultController");

const router = express.Router();

// all require auth
router.use(protect);

router.get("/admin/all", admin, ctrl.getAllVaultItems);
router.put("/admin/:id", admin, ctrl.updateAnyVaultItem);
router.delete("/admin/:id", admin, ctrl.deleteAnyVaultItem);

router.post("/", ctrl.createItem);
router.get("/", ctrl.listItems);
router.get("/export", ctrl.exportAll);
router.get("/:id", ctrl.getItem);
router.patch("/:id", ctrl.updateItem);
router.delete("/:id", ctrl.deleteItem);

module.exports = router;
