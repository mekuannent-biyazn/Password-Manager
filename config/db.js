const mongoose = require("mongoose");
const User = require("../models/User");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_uRI Not Set.");
    const con = await mongoose.connect(uri);
    console.log(`MongoDB Connected on: ${con.connection.host}`);

    await User.createCollection();
    console.log("user collection is created successfully");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit();
  }
};

module.exports = connectDB;
