const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const transactionRoutes = require("./routes/transactionRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Transaction Service Running");
});

app.get("/healthz", (req, res) => {
  res.json({ status: "ok", service: "transaction-service" });
});

app.use("/api/transactions", transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Transaction Service running on port ${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
