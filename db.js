const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) console.error('DB Error:', err.message);
    else console.log('Connected to SQLite');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS SensorsData (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL,
        lon REAL,
        x REAL,
        y REAL,
        z REAL,
        bpm REAL,
        spo2 REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

module.exports = db;
