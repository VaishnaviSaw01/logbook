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
    res.send("Transaction Service Running");
});

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
    console.log(`Transaction Service running on port ${PORT}`);
});
app.get("/transaction", (req, res) => {
    res.send("Transaction Service Running");
});