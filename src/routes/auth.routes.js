const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Kullanıcı Kimlik Doğrulama ve Profil Yönetimi
 */

// Validasyon kuralları
const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('İsim alanı zorunludur')
    .isLength({ max: 100 })
    .withMessage('İsim en fazla 100 karakter olabilir'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter uzunluğunda olmalıdır')
    .matches(/[A-Z]/)
    .withMessage('Şifre en az bir büyük harf içermelidir')
    .matches(/[a-z]/)
    .withMessage('Şifre en az bir küçük harf içermelidir')
    .matches(/[0-9]/)
    .withMessage('Şifre en az bir rakam içermelidir'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Unvan en fazla 100 karakter olabilir'),
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar geçerli bir URL veya dosya yolu olmalıdır'),
];

const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Şifre alanı zorunludur'),
];

const updateMeRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('İsim en fazla 100 karakter olabilir'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Unvan en fazla 100 karakter olabilir'),
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar geçerli bir URL veya dosya yolu olmalıdır'),
];

const updatePasswordRules = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifre alanı zorunludur'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Yeni şifre en az 8 karakter uzunluğunda olmalıdır')
    .matches(/[A-Z]/)
    .withMessage('Yeni şifre en az bir büyük harf içermelidir')
    .matches(/[a-z]/)
    .withMessage('Yeni şifre en az bir küçük harf içermelidir')
    .matches(/[0-9]/)
    .withMessage('Yeni şifre en az bir rakam içermelidir'),
];

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı oluşturur
 *     description: Şifre en az 8 karakter olmalı, en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mustafa Altıparmak
 *               email:
 *                 type: string
 *                 example: mustafa.dev@example.com
 *               password:
 *                 type: string
 *                 example: Sifre12345
 *               title:
 *                 type: string
 *                 example: Full Stack Developer
 *               avatar:
 *                 type: string
 *                 example: https://avatar.iran.liara.run/public
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Geçersiz parametreler veya zaten kayıtlı e-posta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', registerRules, validate, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Kullanıcı girişi yapar ve JWT token döner
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: mustafa.dev@example.com
 *               password:
 *                 type: string
 *                 example: Sifre12345
 *     responses:
 *       200:
 *         description: Giriş başarılı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Hatalı e-posta veya şifre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginRules, validate, login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Giriş yapan kullanıcının profil bilgilerini getirir
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı profili başarıyla getirildi
 *       401:
 *         description: Yetkisiz erişim / Geçersiz token
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Giriş yapan kullanıcının profil bilgilerini günceller
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mustafa Altıparmak Güncel
 *               title:
 *                 type: string
 *                 example: Lead Developer
 *               avatar:
 *                 type: string
 *                 example: https://avatar.iran.liara.run/public/boy
 *     responses:
 *       200:
 *         description: Profil başarıyla güncellendi
 *       401:
 *         description: Yetkisiz erişim
 */
router.put('/me', protect, updateMeRules, validate, updateMe);

/**
 * @swagger
 * /auth/update-password:
 *   put:
 *     summary: Kullanıcının şifresini günceller
 *     description: Mevcut şifreyi doğrular ve yeni güçlü şifreyi kaydeder.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: Password123
 *               newPassword:
 *                 type: string
 *                 example: NewSecretPassword99
 *     responses:
 *       200:
 *         description: Şifre başarıyla güncellendi
 *       400:
 *         description: Geçersiz şifre formatı veya eski şifre ile aynı
 *       401:
 *         description: Mevcut şifre hatalı veya geçersiz token
 */
router.put(
  '/update-password',
  protect,
  updatePasswordRules,
  validate,
  updatePassword
);

module.exports = router;
