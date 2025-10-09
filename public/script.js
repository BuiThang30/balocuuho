document.addEventListener("DOMContentLoaded", () => {
  // === NAVBAR SCROLL EFFECT ===
  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });

  // === MAP ===
  const map = L.map("map").setView([21.0278, 105.8342], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);
  let espMarker = L.marker([21.0278, 105.8342]).addTo(map);

  // --- Chart helpers ---
  function createChart(canvasId, label, color, min, max) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label,
          data: [],
          borderColor: color,
          backgroundColor: color.replace("1)", "0.1)"),
          fill: true,
          tension: 0.3,
          pointRadius: 2,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min, max } } },
    });
  }

  function createMultiChart(canvasId, datasets, min, max) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: datasets.map(ds => ({
          label: ds.label,
          data: [],
          borderColor: ds.color,
          backgroundColor: ds.color.replace("1)", "0.1)"),
          fill: false,
          tension: 0.3,
          pointRadius: 2,
        })),
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min, max } } },
    });
  }

  function updateChart(chart, time, values) {
    if (!chart) return;
    chart.data.labels.push(time);
    if (Array.isArray(values)) {
      values.forEach((val, i) => {
        chart.data.datasets[i].data.push(val);
        if (chart.data.datasets[i].data.length > 10) chart.data.datasets[i].data.shift();
      });
    } else {
      chart.data.datasets[0].data.push(values);
      if (chart.data.datasets[0].data.length > 10) chart.data.datasets[0].data.shift();
    }
    if (chart.data.labels.length > 10) chart.data.labels.shift();
    chart.update();
  }

  function formatTimeUTC7(timestamp) {
    const d = new Date(timestamp);
    d.setHours(d.getHours() + 7);
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const hm = d.toLocaleTimeString("vi-VN", { hour12: false, hour: "2-digit", minute: "2-digit" });
    return `${weekday} ${hm}`;
  }

  // --- Cập nhật warnings theo status 0/1/2/3 ---
  function updateWarningsFromESP(status) {
    const mapStatus = {
      mpu: [
        { text: "Bình thường", class: "normal" },
        { text: "⚠️ Có thể đã bị ngã!", class: "danger" }
      ],
      max30100: [
        { text: "Bình thường", class: "normal" },
        { text: "❤️ Nhịp tim bất thường!", class: "alert" },
        { text: "🫁 SpO₂ thấp!", class: "danger" }
      ],
      temperature: [
        { text: "Bình thường", class: "normal" },
        { text: "🌡️ Nhiệt độ cao!", class: "danger" },
        { text: "❄️ Nhiệt độ thấp!", class: "alert" }
      ],
      humidity: [
        { text: "Bình thường", class: "normal" },
        { text: "💧 Độ ẩm cao!", class: "alert" },
        { text: "💧 Không khí khô!", class: "alert" }
      ],
      co2: [
        { text: "Bình thường", class: "normal" },
        { text: "☠️ Nồng độ CO₂ cao!", class: "danger" }
      ],
    };

    function setStatus(elId, map, value) {
      const el = document.getElementById(elId);
      if (!el) return;

      // đảm bảo value là số index (phòng trường hợp "1" là string)
      const idx = parseInt(value, 10);
      const item = (map && typeof map[idx] !== "undefined") ? map[idx] : map[0];

      // chỉ cập nhật text cho <p> status (không chạm tới <h3>)
      el.textContent = item.text || "--";

      // cập nhật class trên wrapper .warning: luôn đảm bảo có "warning" + trạng thái
      const parent = el.closest(".warning");
      if (!parent) return;
      parent.className = "warning " + (item.class || "normal");

      // nếu lỡ <h3> bị xóa vì code khác, ta đảm bảo tạo lại (chỉ khi thiếu)
      if (!parent.querySelector("h3")) {
        const h = document.createElement("h3");
        h.textContent = "Warning";
        parent.insertBefore(h, el); // chèn trước <p>
      }

      // debug (tạm): kiểm tra class - comment dòng này khi ổn
      // console.log(elId, "->", parent.className);
    }

    setStatus("statusMpu6050", mapStatus.mpu, status.mpu);
    setStatus("statusMax30100", mapStatus.max30100, status.max30100);
    setStatus("statusTemperature", mapStatus.temperature, status.temperature);
    setStatus("statusHumidity", mapStatus.humidity, status.humidity);
    setStatus("statusCO2", mapStatus.co2, status.co2);
  }



  // --- Khởi tạo chart ---
  const charts = {
    mpu: createMultiChart("chartMpu", [
      { label: "MPU X (°)", color: "rgba(255,0,0,1)" },
      { label: "MPU Y (°)", color: "rgba(0,255,0,1)" },
      { label: "MPU Z (°)", color: "rgba(0,0,255,1)" },
    ], -180, 180),
    max30100: createMultiChart("chartMax30100", [
      { label: "Heart Rate (BPM)", color: "rgba(255,165,0,1)" },
      { label: "SpO₂ (%)", color: "rgba(153,102,255,1)" },
    ], 0, 200),
    temperature: createChart("chartTemp", "Temperature (°C)", "rgba(255,99,132,1)", 0, 40),
    humidity: createChart("chartHumidity", "Humidity (%)", "rgba(54,162,235,1)", 0, 100),
    co2: createChart("chartCO2", "CO₂ (ppm)", "rgba(75,192,192,1)", 0, 2000),
  };

  let lastTimestamp = null;

  // --- Load lịch sử ---
  async function loadHistory() {
    try {
      const res = await fetch("/api/sensors/history");
      const rows = await res.json();
      rows.forEach((r) => {
        const time = formatTimeUTC7(r.timestamp.replace(" ", "T"));
        updateChart(charts.mpu, time, [r.x, r.y, r.z]);
        updateChart(charts.max30100, time, [r.bpm, r.spo2]);
        updateChart(charts.temperature, time, r.temperature);
        updateChart(charts.humidity, time, r.humidity);
        updateChart(charts.co2, time, r.CO2);
      });
      if (rows.length) lastTimestamp = rows[rows.length - 1].timestamp;
    } catch (err) {
      console.error("History error:", err);
    }
  }

  // --- Cập nhật realtime ---
  async function fetchLatest() {
    try {
      const res = await fetch("/api/sensors/latest");
      const data = await res.json();
      if (!data) return;

      const time = formatTimeUTC7(data.timestamp);

      // --- Update hiển thị realtime ---
      document.getElementById("angleX").textContent = `X: ${data.x}°`;
      document.getElementById("angleY").textContent = `Y: ${data.y}°`;
      document.getElementById("angleZ").textContent = `Z: ${data.z}°`;
      document.getElementById("heartRate").textContent = `${data.bpm} bpm`;
      document.getElementById("spo2").textContent = `SpO₂: ${data.spo2}%`;
      document.getElementById("tempValue").textContent = `${data.temperature} °C`;
      document.getElementById("humValue").textContent = `${data.humidity} %`;
      document.getElementById("co2Value").textContent = `${data.CO2} PPM`;

      if (data.lat && data.lon) {
        espMarker.setLatLng([data.lat, data.lon]);
        map.setView([data.lat, data.lon], 13);
        document.getElementById("coords").value = `Lat: ${data.lat.toFixed(5)}, Lon: ${data.lon.toFixed(5)}`;
      }

      if (data.timestamp !== lastTimestamp) {
        lastTimestamp = data.timestamp;
        updateChart(charts.mpu, time, [data.x, data.y, data.z]);
        updateChart(charts.max30100, time, [data.bpm, data.spo2]);
        updateChart(charts.temperature, time, data.temperature);
        updateChart(charts.humidity, time, data.humidity);
        updateChart(charts.co2, time, data.CO2);
      }

      // --- Lấy status riêng từ ESP ---
      const statusRes = await fetch("/api/sensors/status");
      const statusData = await statusRes.json();

      // Cập nhật trực tiếp status từ server
      if (statusData && statusData.received) {
        updateWarningsFromESP(statusData.received);
      } else {
        updateWarningsFromESP({ mpu: 0, max30100: 0, temperature: 0, humidity: 0, co2: 0 });
      }

    } catch (err) {
      console.error("Latest error:", err);
    }
  }

  // --- Chạy ---
  loadHistory();
  setInterval(fetchLatest, 2000);
});
