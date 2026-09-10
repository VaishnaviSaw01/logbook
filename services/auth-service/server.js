const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const staffRoutes = require("./routes/staffRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Auth Service Running");
});

// Liveness/readiness probe for Kubernetes
app.get("/healthz", (req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Central error handler so a bad request or DB error returns a clean
// JSON response instead of crashing the whole service.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

// Safety net: log unexpected rejections instead of silently losing them.
// (Express 5 forwards async route-handler rejections to the error
// middleware above already; this only covers code paths outside Express.)
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
