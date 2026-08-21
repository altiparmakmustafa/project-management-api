require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// HTTP Sunucusu oluşturma
const server = http.createServer(app);

// Sunucuyu başlatma fonksiyonu
const startServer = async () => {
  try {
    // 1. Veritabanına bağlan
    await connectDB();

    // 2. HTTP Sunucusunu dinlemeye başla
    server.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
      console.log(`📚 Swagger Dokümanı: http://localhost:${PORT}/api-docs`);
      console.log(`🩺 Health Check:     http://localhost:${PORT}/api/v1/health`);
      console.log(`=============================================`);
    });
  } catch (error) {
    console.error('Sunucu başlatılırken hata oluştu:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { server, app };