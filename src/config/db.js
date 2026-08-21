const mongoose = require('mongoose');

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
