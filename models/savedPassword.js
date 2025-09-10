const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema(
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

// passwordSchema.index({ owner: 1, title: 1 });
passwordSchema.index(
  { owner: 1, title: 1, password: 1, iv: 1, tag: 1 },
  { unique: true }
);

const Passwordmngt = mongoose.model("SavedPassword", passwordSchema);

module.exports = Passwordmngt;
