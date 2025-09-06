const crypto = require("crypto");

// derive a per-user key from MASTER_KEY and userId (salt = userId)
function deriveKey(userId) {
  const masterHex = process.env.MASTER_KEY_HEX;
  if (!masterHex) throw new Error("MASTER_KEY_HEX not set");
  const master = Buffer.from(masterHex, "hex"); // 32 bytes recommended
  const salt = Buffer.from(String(userId));
  // scrypt: cost ~ N=2^14 by default; sync for simplicity here
  return crypto.scryptSync(master, salt, 32); // AES-256 key
}

function encryptForUser(userId, plaintext) {
  const key = deriveKey(userId);
  const iv = crypto.randomBytes(12); // GCM recommended 12 bytes
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    passwordEnc: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function decryptForUser(userId, { passwordEnc, iv, tag }) {
  const key = deriveKey(userId);
  const ivBuf = Buffer.from(iv, "base64");
  const tagBuf = Buffer.from(tag, "base64");
  const ct = Buffer.from(passwordEnc, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuf);
  decipher.setAuthTag(tagBuf);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

module.exports = { encryptForUser, decryptForUser };
