import express from "express";
import cors from "cors";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
