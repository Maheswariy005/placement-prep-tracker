const express = require("express");
require("dotenv").config();

const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

connectDB();
const app = express();

app.use(cors({
    origin: process.env.CLIENT_ORIGIN
}));
app.use(express.json());
app.use("/api/auth",authRoutes);

const PORT = process.env.PORT || 5000;


app.get("/", (req, res) => {
    res.send("Placement Prep Tracker Backend is running!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
