const User = require("../models/User");
const VaultItem = require("../models/VaultItem");

// List users with counts
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("_id name email role createdAt")
      .lean();
    const counts = await VaultItem.aggregate([
      { $group: { _id: "$owner", total: { $sum: 1 } } },
    ]);

    const map = new Map(counts.map((c) => [String(c._id), c.total]));

    res.json(
      users.map((u) => ({
        ...u,
        vaultCount: map.get(String(u._id)) || 0,
      }))
    );
  } catch (err) {
    next(err);
  }
};

// Change a user's role
exports.setRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body; // 'admin' or 'user'
    if (!["admin", "user"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    // Prevent removing last admin
    if (role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });
      const target = await User.findById(userId).lean();
      if (target?.role === "admin" && adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot demote the last admin" });
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("_id name email role");
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Role updated", user: updated });
  } catch (err) {
    next(err);
  }
};

// Danger: delete user and their vault items
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (String(req.user._id) === String(userId))
      return res.status(400).json({ message: "Admin cannot delete self" });

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    // Prevent removing last admin
    if (target.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1)
        return res
          .status(400)
          .json({ message: "Cannot delete the last admin" });
    }

    await VaultItem.deleteMany({ owner: userId });
    await target.deleteOne();
    res.json({ message: "User and their data deleted" });
  } catch (err) {
    next(err);
  }
};
