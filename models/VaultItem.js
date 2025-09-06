const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    username: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },

    passwordEnc: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },

    folder: { type: String, trim: true, default: "default" },
  },
  { timestamps: true }
);

vaultSchema.index({ owner: 1, title: 1 });

const Vault = mongoose.model("Vaultitem", vaultSchema);

module.exports = Vault;
