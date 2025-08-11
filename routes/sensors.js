const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
    const { lat, lon, x, y, z, bpm, spo2 } = req.body;

    db.run(
        `INSERT INTO SensorsData(lat, lon, x, y, z, bpm, spo2) VALUES (?,?,?,?,?,?,?)`,
        [lat, lon, x, y, z, bpm, spo2],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

router.get('/', (req, res) => {
    db.all(`SELECT * FROM SensorsData ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
