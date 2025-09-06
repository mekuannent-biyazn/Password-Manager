const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");

dotenv.config();

const PORT = process.env.PORT;

(async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`server is running on http://localhost:${PORT} `);
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
})();
