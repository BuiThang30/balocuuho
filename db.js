const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs"); // thêm require

// Kết nối DB
const db = new sqlite3.Database(path.join(__dirname, "database.db"), (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("Connected to SQLite");
});

// Tạo bảng SensorsData
db.run(
  `CREATE TABLE IF NOT EXISTS SensorsData (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL,
    lon REAL,
    x REAL,
    y REAL,
    z REAL,
    bpm REAL,
    spo2 REAL,
    temperature REAL,
    humidity REAL,
    CO2 REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  (err) => {
    if (err) console.error("Error creating SensorsData table", err);
  }
);

// Tạo bảng User
db.run(
  `CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`,
  (err) => {
    if (err) console.error("Error creating User table", err);
  }
);

// Hàm thêm user
async function addUser(username, plainPassword) {
  const hash = await bcrypt.hash(plainPassword, 10);
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO User (username, password) VALUES (?, ?)`,
      [username, hash],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

// Hàm kiểm tra user
async function checkUser(username, plainPassword) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM User WHERE username = ?`, [username], async (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(false);
      else {
        const match = await bcrypt.compare(plainPassword, row.password);
        resolve(match ? row : false);
      }
    });
  });
}

module.exports = {
  db,
  addUser,
  checkUser
};
