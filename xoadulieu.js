const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Kết nối đến database
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) {
    console.error('DB connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Xóa tất cả dữ liệu trong bảng SensorsData
db.run("DELETE FROM SensorsData", function(err) {
  if (err) {
    console.error('Error deleting data:', err.message);
  } else {
    console.log(`All data deleted from SensorsData. Rows affected: ${this.changes}`);
  }
});

// Đóng kết nối
db.close((err) => {
  if (err) console.error('Error closing DB:', err.message);
  else console.log('Database connection closed.');
});
