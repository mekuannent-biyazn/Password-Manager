const express = require("express");
const helmet = require("helmet");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const userRoute = require("./routes/authRoute");
const { globalLimiter } = require("./middlewares/rateLimiteMiddleware");
const passwordRoute = require("./routes/passwordRoute");
const adminRoute = require("./routes/adminRoute");
const session = require("express-session");
const app = express();

app.use(express.json());
app.use(helmet());
app.use(globalLimiter);

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.get("/api", (req, res) => {
  res.send("Well Come To Password Manager!");
});

app.use("/api/users", userRoute);
app.use("/api/password", passwordRoute);
app.use("/api/admin", adminRoute);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
