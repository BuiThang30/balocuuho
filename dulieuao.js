const { db } = require("./db");

// Hàm tạo số ngẫu nhiên trong khoảng min-max
function random(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Tạo 10 bản ghi ảo, mỗi bản ghi cách nhau 1 giây
for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    const lat = random(20.9, 21.1);
    const lon = random(105.8, 106.0);
    const x = random(-180, 180);
    const y = random(-180, 180);
    const z = random(-180, 180);
    const bpm = random(60, 100);
    const spo2 = random(90, 100);
    const temperature = random(25, 32);
    const humidity = random(25, 90);
    const co2 = random(20, 150);

    db.run(
      `INSERT INTO SensorsData(lat, lon, x, y, z, bpm, spo2, temperature, humidity, CO2) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lat, lon, x, y, z, bpm, spo2, temperature, humidity, co2],
      function (err) {
        if (err) console.error("Error:", err.message);
        else console.log("Inserted ID:", this.lastID);
      }
    );
  }, i * 1000); // Delay i giây cho mỗi lần lặp
}
