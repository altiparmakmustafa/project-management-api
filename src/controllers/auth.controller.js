const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// JWT Token üretme yardımcısı
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Yeni kullanıcı kaydı
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, title, avatar } = req.body;

  // Kullanıcı zaten var mı?
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Bu e-posta adresi zaten kullanımda.');
  }

  // Yeni kullanıcı oluştur
  const user = await User.create({
    name,
    email,
    password,
    title,
    avatar,
  });

  const token = generateToken(user._id);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user,
        token,
      },
      'Kullanıcı kaydı başarıyla tamamlandı'
    )
  );
});

/**
 * @desc    Kullanıcı girişi (Login)
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Kullanıcıyı şifresiyle birlikte getir
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Geçersiz e-posta adresi veya şifre.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçiniz.');
  }

  // Şifreyi doğrula
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Geçersiz e-posta adresi veya şifre.');
  }

  const token = generateToken(user._id);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        token,
      },
      'Giriş başarılı'
    )
  );
});

/**
 * @desc    Giriş yapan kullanıcının kendi profili
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json(
    new ApiResponse(200, user, 'Kullanıcı profili getirildi')
  );
});

/**
 * @desc    Kullanıcı profil güncelleme (İsim / Unvan / Avatar)
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, title, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, title, avatar },
    { new: true, runValidators: true }
  );

  res.status(200).json(
    new ApiResponse(200, user, 'Profil başarıyla güncellendi')
  );
});

/**
 * @desc    Kullanıcının şifresini günceller
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'Kullanıcı bulunamadı.');
  }

  // Mevcut şifreyi kontrol et
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Mevcut şifreniz hatalı.');
  }

  // Yeni şifre eskisiyle aynı mı?
  if (currentPassword === newPassword) {
    throw new ApiError(400, 'Yeni şifreniz mevcut şifrenizle aynı olamaz.');
  }

  user.password = newPassword;
  await user.save();

  // Yeni token üret
  const token = generateToken(user._id);

  res.status(200).json(
    new ApiResponse(
      200,
      { token },
      'Şifreniz başarıyla güncellendi'
    )
  );
});

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
};
