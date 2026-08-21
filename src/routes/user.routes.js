const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Tüm kullanıcı yönetim rotaları JWT korumalı ve SADECE ADMIN erişimine açıktır
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Users (Admin)
 *   description: Sistem Yöneticisi için Kullanıcı ve Yetki Yönetimi
 */

const updateUserRules = [
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
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage("Rol 'user' veya 'admin' olmalıdır"),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage("isActive değeri 'true' veya 'false' olmalıdır"),
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar geçerli bir URL veya dosya yolu olmalıdır'),
];

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Sistemdeki tüm kullanıcıları listeler (Admin)
 *     tags: [Users (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: İsim, e-posta veya unvanda arama
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Role göre filtrele
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Aktiflik durumuna göre filtrele
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına kullanıcı sayısı
 *     responses:
 *       200:
 *         description: Kullanıcılar listelendi
 *       403:
 *         description: Yetkisiz erişim (Sadece Admin)
 */
router.get('/', getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Tek bir kullanıcının detaylarını ve istatistiklerini getirir (Admin)
 *     tags: [Users (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı detayları ve istatistikleri getirildi
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Kullanıcının bilgilerini, rolünü veya durumunu günceller (Admin)
 *     tags: [Users (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isActive:
 *                 type: boolean
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kullanıcı güncellendi
 *       400:
 *         description: Geçersiz parametre veya kendi yetkisini kaldırma girişimi
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.put('/:id', updateUserRules, validate, updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Kullanıcıyı sistemden siler (Admin)
 *     tags: [Users (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı silindi
 *       400:
 *         description: Kendi hesabını silme girişimi
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.delete('/:id', deleteUser);

module.exports = router;
