const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db'); // import database

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API nhận dữ liệu từ ESP32
app.post('/api/sensors', (req, res) => {
    const { lat, lon, x, y, z, bpm, spo2 } = req.body;
    db.run(
        `INSERT INTO SensorsData(lat, lon, x, y, z, bpm, spo2) VALUES (?,?,?,?,?,?,?)`,
        [lat, lon, x, y, z, bpm, spo2],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// API lấy dữ liệu để hiển thị web
app.get('/api/sensors', (req, res) => {
    db.all(`SELECT * FROM SensorsData ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
