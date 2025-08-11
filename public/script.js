// nav 
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Khởi tạo map tại vị trí mặc định (Hà Nội)
const map = L.map('map').setView([21.0278, 105.8342], 13);

// Thêm layer bản đồ OSM miễn phí
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// Marker đại diện cho vị trí ESP
let espMarker = L.marker([21.0278, 105.8342]).addTo(map);

// Hàm cập nhật tọa độ nhận từ ESP
function updateESPPosition(lat, lon) {
  document.getElementById('coords').value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  espMarker.setLatLng([lat, lon]);
  map.setView([lat, lon], 15);
}

// Demo: Giả lập ESP gửi tọa độ mới sau 3 giây
setTimeout(() => {
  updateESPPosition(21.033, 105.85);
}, 3000);

// Khởi tạo chart MPU6050 (hiển thị góc X)
const ctxMPU = document.getElementById('mpuChart').getContext('2d');
const mpuChart = new Chart(ctxMPU, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Góc X (°)',
      data: [],
      borderColor: 'blue',
      backgroundColor: 'rgba(0,0,255,0.1)',
      tension: 0.2,
      pointRadius: 3
    }]
  },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { labels: { color: '#000' } } },
    scales: {
      x: { display: false },
      y: { min: -180, max: 180 }
    }
  }
});

// Khởi tạo chart MAX30100 (nhịp tim)
const ctxHeart = document.getElementById('heartChart').getContext('2d');
const heartChart = new Chart(ctxHeart, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Nhịp tim (bpm)',
      data: [],
      borderColor: 'red',
      backgroundColor: 'rgba(255,0,0,0.1)',
      tension: 0.2,
      pointRadius: 3
    }]
  },
  options: {
    responsive: true,
    animation: false,
    plugins: { legend: { labels: { color: '#000' } } },
    scales: {
      x: { display: false },
      y: { min: 40, max: 180 }
    }
  }
});

// Hàm cập nhật số liệu
function updateSensorData(data) {
  // Cập nhật box MPU6050
  document.getElementById('angleX').innerText = `X: ${data.angleX}°`;
  document.getElementById('angleY').innerText = `Y: ${data.angleY}°`;
  document.getElementById('angleZ').innerText = `Z: ${data.angleZ}°`;

  // Cập nhật box MAX30100
  document.getElementById('heartRate').innerText = `${data.heartRate} bpm`;
  document.getElementById('spo2').innerText = `SpO2: ${data.spo2}%`;

  // Cập nhật chart
  const now = new Date().toLocaleTimeString();
  
  // Chart MPU6050 (góc X)
  mpuChart.data.labels.push(now);
  mpuChart.data.datasets[0].data.push(data.angleX);
  if (mpuChart.data.labels.length > 20) {
    mpuChart.data.labels.shift();
    mpuChart.data.datasets[0].data.shift();
  }
  mpuChart.update();

  // Chart MAX30100 (nhịp tim)
  heartChart.data.labels.push(now);
  heartChart.data.datasets[0].data.push(data.heartRate);
  if (heartChart.data.labels.length > 20) {
    heartChart.data.labels.shift();
    heartChart.data.datasets[0].data.shift();
  }
  heartChart.update();
}

// 🔹 Demo: Giả lập dữ liệu từ ESP mỗi 1 giây
setInterval(() => {
  const fakeData = {
    angleX: (Math.random()*360-180).toFixed(2),
    angleY: (Math.random()*360-180).toFixed(2),
    angleZ: (Math.random()*360-180).toFixed(2),
    heartRate: Math.floor(Math.random()*40+60),
    spo2: Math.floor(Math.random()*5+95)
  };
  updateSensorData(fakeData);
}, 1000);
