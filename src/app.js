const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const ApiError = require('./utils/apiError');

const app = express();

// Güvenlik ve Yardımcı Middleware'ler
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Statik Dosyalar (Uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API Dokümantasyonu
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Hoşgeldin / Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Trello Benzeri Görev & Proje Yönetim API',
    docs: '/api-docs',
    health: '/api/v1/health',
    version: '1.0.0',
  });
});

// API v1 Rotaları
app.use('/api/v1', routes);

// 404 Bulunamayan Rotalar için Yakalayıcı
app.use((req, res, next) => {
  next(new ApiError(404, `İstenen kaynak bulunamadı: ${req.originalUrl}`));
});

// Merkezi Hata Yönetimi Middleware
app.use(errorHandler);

module.exports = app;
