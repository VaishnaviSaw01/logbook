const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const insightsRoutes = require("./routes/insightsRoutes");
const aiProvider = require("./services/aiProvider");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Insights Service Running");
});

app.get("/healthz", (req, res) => {
  res.json({ status: "ok", service: "insights-service", aiConfigured: aiProvider.isConfigured() });
});

app.use("/api/insights", insightsRoutes);

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

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`Insights Service running on port ${PORT}`);
  console.log(`AI provider configured: ${aiProvider.isConfigured()}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
