const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Bu işlem için giriş yapmanız ve token göndermeniz gerekmektedir.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'Bu token ile ilişkili kullanıcı bulunamadı.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Geçersiz token.');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token süresi dolmuş. Lütfen tekrar giriş yapınız.');
    }
    throw error;
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Bu kaynağa erişim yetkiniz bulunmamaktadır.');
    }
    next();
  };
};

module.exports = { protect, authorize };
