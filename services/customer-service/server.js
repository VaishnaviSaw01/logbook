const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Customer Service Running");
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Customer Service running on port ${PORT}`);
});
app.get("/customer", (req, res) => {
    res.send("Customer Service Running");
});