const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

function singleToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res
        .status(400)
        .json({ message: "name, email and password is required!" });

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars, include uppercase, lowercase, number, and special character",
      });
    }

    if (password !== confirmPassword)
      return res.status(400).json({ message: "confirmPassword error" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    const user = await User.create({ name, email, password: hash, role });

    const token = singleToken(user);
    res.status(201).json({
      message: "user created successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Enter Email and Password!" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "This Email is not registered!" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ massage: "Invalid Password!" });

    const token = singleToken(user);
    res.json({
      message: "loged in successfull",
      user: { id: user._id, name: user.name, email: user.email },
      token: token,
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const me = await User.findById(req.user.id)
      .select("_id name email createdAt")
      .lean();

    if (!me) return res.status(404).json({ message: "User not found!" });

    res.status(200).json(me);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPass, newPass } = req.body;
    if (!currentPass || !newPass)
      return res
        .status(400)
        .json({ message: "current and new pASSWORD is required!" });

    const newpassRegx =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const you = await User.findById(req.user._id);
    if (!you) return res.status(404).json({ message: "User not found" });

    if (!newpassRegx.test(newPass)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars, include uppercase, lowercase, number, and special character",
      });
    }
    const valid = await bcrypt.compare(currentPass, you.password);
    if (!valid)
      return res.status(400).json({ message: "incorrect current password!" });

    you.password = await bcrypt.hash(newPass, 12);
    await you.save();

    res
      .status(200)
      .json({ message: "Password updated successFully, Please re-login" });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, changePassword };
