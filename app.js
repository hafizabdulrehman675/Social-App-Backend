const express = require("express");
const cors = require("cors");
const path = require("path");
const AppError = require("./utils/appError");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Social App API is running!" });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes   = require("./routes/authRoutes");
const usersRoutes  = require("./routes/usersRoutes");
const postsRoutes  = require("./routes/postsRoutes");
const socialRoutes = require("./routes/socialRoutes");

app.use("/api/auth",   authRoutes);
app.use("/api/users",  usersRoutes);
app.use("/api/posts",  postsRoutes);
app.use("/api/social", socialRoutes);

// ─── 404 Handler — unknown routes ────────────────────────────────────────────
// If no route matched above, this runs and creates a 404 AppError
app.all("/*splat", (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ─── Global Error Handler — MUST be last middleware ──────────────────────────
// Express knows this is an error handler because it has 4 parameters
// Every next(err) call anywhere in the app lands here
app.use(errorHandler);

module.exports = app;
