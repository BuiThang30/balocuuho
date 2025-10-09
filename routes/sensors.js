const express = require("express");
const router = express.Router();
const { db } = require("../db");

// --- Biến lưu status tạm ---
let lastStatus = {
  mpu: 0,
  max30100: 0,
  temperature: 0,
  humidity: 0,
  co2: 0,
};

// --- API nhận dữ liệu sensor ---
router.post("/data", (req, res) => {
  try {
    const {
      gps = {},
      mpu = {},
      heartrate,
      spo2 = null,
      temperature,
      humidity,
      CO2,
      status = {},
    } = req.body;

    const lat = gps.lat || null;
    const lon = gps.lon || null;
    const x = mpu.x || null;
    const y = mpu.y || null;
    const z = mpu.z || null;
    const bpm = heartrate || null;

    // Chỉ log status nhận được, không cập nhật lastStatus
    console.log("📥 Dữ liệu nhận được:", {
      lat, lon, x, y, z, bpm, spo2, temperature, humidity, CO2, receivedStatus: status
    });

    db.run(
      `INSERT INTO SensorsData(
        lat, lon, x, y, z, bpm, spo2, temperature, humidity, CO2
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lat, lon, x, y, z, bpm, spo2, temperature, humidity, CO2],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`✅ Đã lưu bản ghi ID: ${this.lastID}`);
        res.json({ success: true, id: this.lastID });
      }
    );
  } catch (error) {
    console.error("❌ JSON lỗi:", error.message);
    res.status(400).json({ error: "Invalid JSON format" });
  }
});

// --- API nhận status từ ESP ---
router.post("/status", (req, res) => {
  try {
    const { mpu = 0, max30100 = 0, temperature = 0, humidity = 0, co2 = 0 } = req.body;
    lastStatus = { mpu, max30100, temperature, humidity, co2 };
    console.log("📥 Status nhận được:", lastStatus);
    res.json({ success: true, receivedStatus: lastStatus });
  } catch (error) {
    console.error("❌ JSON lỗi:", error.message);
    res.status(400).json({ error: "Invalid JSON format" });
  }
});

// --- API trả về status hiện tại ---
router.get("/status", (req, res) => {
  res.json({ received: lastStatus }); // thêm key "received" cho frontend
});

// --- Lịch sử 10 bản ghi ---
router.get("/history", (req, res) => {
  db.all(
    `SELECT * FROM (SELECT * FROM SensorsData ORDER BY timestamp DESC LIMIT 10) sub 
     ORDER BY timestamp ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// --- Lấy bản ghi mới nhất ---
router.get("/latest", (req, res) => {
  db.get(
    "SELECT * FROM SensorsData ORDER BY timestamp DESC LIMIT 1",
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || null);
    }
  );
});

module.exports = router;
