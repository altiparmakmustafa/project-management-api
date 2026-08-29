const mongoose = require('mongoose');
const dns = require('dns');

// macOS / yerel ağ DNS SRV çözümleme sorunlarını önlemek için güvenilir DNS sunucuları tanımlanır
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Varsayılan sistem DNS sunucusu kullanılır
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Bağlantı başarılı: ${conn.connection.host} / DB: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Bağlantı hatası: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
