const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function singleToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

async function signToken(payload, options = {}) {
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    ...options,
  });
}

// Helper to issue JWT + basic profile
const respondWithAuth = (res, user, status = 200) => {
  const token = signToken({ id: user._id, role: user.role });
  return res.status(status).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token,
  });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mekuannentbiyazn@gmail.com",
    pass: "oieceoiynxdocycx",
  },
});

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({
        message: "name, email, password and confirm password is required!",
      });

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
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      otp,
      otpExpiry,
    });

    await transporter.sendMail({
      from: "mekuannentbiyazn@gmail.com",
      to: email,
      subject: "OTP verification",
      text: `your OTP is ${otp}`,
    });

    const token = singleToken(user);
    res.status(201).json({
      message:
        "user created successfully, please verify OTP send to your email",
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

async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "user not found!" });
    if (user.isVerified)
      return res.status(400).json({ message: "user is already verified" });

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      res.status(400).json({ message: "invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Email Verified successfully, you can now log in!" });
  } catch (error) {
    res.status(500).json({ message: "Error Verifing OYP", error });
  }
}

async function resendOTP(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "user not found!" });
    if (user.isVerified)
      return res.status(400).json({ message: "user is already verified" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: "mekuannentbiyazn@gmail.com",
      to: email,
      subject: "Resend OTP Verification",
      text: `Your New OTP is: ${otp}`,
    });

    res.json({ message: "OTP resend successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error Resending OTP", error });
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

    if (!user.isVerified)
      return res
        .status(400)
        .json({ message: "Email not verified, please verify OTP" });

    const token = singleToken(user);
    req.session.user = { id: user._id, email: user.email, name: user.name };
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
        .json({ message: "current and new Password is required!" });

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

// OAuth via Google ID token (sent from client)
async function googleAuth(req, res, next) {
  try {
    const { idToken } = req.body; // Obtain from Google Sign-In client
    if (!idToken) return res.status(400).json({ message: "idToken required" });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      const userCount = await User.countDocuments();
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(12).toString("hex"),
        googleId,
        isVerified: true,
        role: userCount === 0 ? "admin" : "user",
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true;
      await user.save();
    }

    return respondWithAuth(res, user);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Error Logout" });
    res.json({ message: "logout successfully!" });
  });
}

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  googleAuth,
  getMe,
  changePassword,
  logout,
};
