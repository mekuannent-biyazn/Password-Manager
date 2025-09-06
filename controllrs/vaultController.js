const { encryptForUser, decryptForUser } = require("../utils/crypto");
const vaultItem = require("../models/VaultItem");
const asyncHandler = require("express-async-handler");
const Vault = require("../models/VaultItem");

exports.createItem = async (req, res, next) => {
  try {
    const {
      title,
      username = "",
      password,
      url = "",
      notes = "",
      folder = "default",
    } = req.body;

    if (!title || !password)
      return res
        .status(400)
        .json({ message: "title and passwored is required" });

    const enc = encryptForUser(req.user._id, password);
    const item = await vaultItem.create({
      owner: req.user._id,
      title,
      username,
      url,
      notes,
      folder,
      ...enc,
    });
    res
      .status(201)
      .json({ message: "Item is created successfully!", id: item._id });
  } catch (err) {
    next(err);
  }
};

exports.listItems = async (req, res, next) => {
  try {
    const { q = "", folder, page = 1, limit = 20 } = req.query;
    const filter = { owner: req.user._id };
    if (q) {
      filter.$or = [
        { title: new RegExp(q, "i") },
        { username: new RegExp(q, "i") },
        { notes: new RegExp(q, "i") },
        { url: new RegExp(q, "i") },
      ];
    }
    if (folder) filter.folder = folder;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      vaultItem
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      vaultItem.countDocuments(filter),
    ]);

    // Do not send plaintext; clients can request one item's password when needed
    res.json({
      total,
      page: Number(page),
      pageSize: items.length,
      items: items.map((i) => ({
        id: i._id,
        title: i.title,
        username: i.username,
        url: i.url,
        notes: i.notes,
        folder: i.folder,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reveal = String(req.query.reveal || "false").toLowerCase() === "true";
    const item = await vaultItem
      .findOne({
        _id: id,
        owner: req.user._id,
      })
      .lean();
    if (!item) return res.status(404).json({ message: "Item not found" });

    const payload = {
      id: item._id,
      title: item.title,
      username: item.username,
      url: item.url,
      notes: item.notes,
      folder: item.folder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    if (reveal) {
      payload.password = decryptForUser(req.user._id, {
        passwordEnc: item.passwordEnc,
        iv: item.iv,
        tag: item.tag,
      });
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

// Update item (re-encrypt on password change)
exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await vaultItem.findOne({ _id: id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const { title, username, password, url, notes, folder } = req.body;

    if (title !== undefined) item.title = title;
    if (username !== undefined) item.username = username;
    if (url !== undefined) item.url = url;
    if (notes !== undefined) item.notes = notes;
    if (folder !== undefined) item.folder = folder;

    if (password !== undefined && password !== "") {
      const enc = encryptForUser(req.user._id, password);
      item.passwordEnc = enc.passwordEnc;
      item.iv = enc.iv;
      item.tag = enc.tag;
    }

    await item.save();
    res.json({ message: "Item updated" });
  } catch (err) {
    next(err);
  }
};

// Delete
exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await vaultItem.findOneAndDelete({
      _id: id,
      owner: req.user._id,
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    next(err);
  }
};

// Export all items (with decrypted passwords)
exports.exportAll = async (req, res, next) => {
  try {
    const items = await vaultItem.find({ owner: req.user._id }).lean();
    const data = items.map((i) => ({
      title: i.title,
      username: i.username,
      password: decryptForUser(req.user._id, {
        passwordEnc: i.passwordEnc,
        iv: i.iv,
        tag: i.tag,
      }),
      url: i.url,
      notes: i.notes,
      folder: i.folder,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
    res.json({ count: data.length, items: data });
  } catch (err) {
    next(err);
  }
};

//  Admin: Get ALL vault items
exports.getAllVaultItems = asyncHandler(async (req, res) => {
  const items = await Vault.find({});
  res.json(items);
});

//  Admin: Update any vault item
exports.updateAnyVaultItem = asyncHandler(async (req, res) => {
  const item = await Vault.findById(req.params.id);

  if (!item) {
    res.status(404);
    throw new Error("Vault item not found");
  }

  item.website = req.body.website || item.website;
  item.username = req.body.username || item.username;
  item.password = req.body.password || item.password;

  const updatedItem = await item.save();
  res.json(updatedItem);
});

//  Admin: Delete any vault item
exports.deleteAnyVaultItem = asyncHandler(async (req, res) => {
  const item = await Vault.findById(req.params.id);

  if (!item) {
    res.status(404);
    throw new Error("Vault item not found");
  }

  await item.deleteOne();
  res.json({ message: "Vault item removed by admin" });
});
