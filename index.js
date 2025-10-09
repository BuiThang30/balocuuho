const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Prevent cache cho tất cả request (vẫn có thể giữ)
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Import routes
const sensorsRoutes = require("./routes/sensors");

// Sử dụng routes
app.use("/api/sensors", sensorsRoutes);

// Routes
app.get("/", (req, res) => res.redirect("/home"));

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Chạy server
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
