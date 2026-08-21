const ApiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.errors = err.errors || [];

  // Mongoose geçersiz ObjectId hatası
  if (err.name === 'CastError') {
    const message = `Geçersiz ID formatı: ${err.value}`;
    error = new ApiError(400, message);
  }

  // Mongoose duplicate key (mükerrer kayıt) hatası (örn: email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Bu ${field} (${err.keyValue[field]}) zaten sistemde kayıtlı.`;
    error = new ApiError(400, message);
  }

  // Mongoose validasyon hatası
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new ApiError(400, message);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Sunucu hatası oluştu';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors.length > 0 ? error.errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
