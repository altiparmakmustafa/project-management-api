const express = require('express');
const { body } = require('express-validator');
const {
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  uploadAttachment,
  deleteAttachment,
} = require('../controllers/task.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Tüm görev rotaları JWT doğrulaması gerektirir
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Görev Yönetimi, Durum Değiştirme ve Dosya Yükleme
 */

const updateTaskRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Görev başlığı en fazla 150 karakter olabilir'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Açıklama en fazla 2000 karakter olabilir'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage("Durum 'todo', 'in-progress' veya 'done' olmalıdır"),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage("Öncelik 'low', 'medium', 'high' veya 'urgent' olmalıdır"),
  body('assignee')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Geçerli bir kullanıcı ID giriniz'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Etiketler bir dizi olmalıdır'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Bitiş tarihi geçerli bir ISO8601 tarih formatı olmalıdır'),
];

const updateStatusRules = [
  body('status')
    .notEmpty()
    .withMessage('Durum alanı zorunludur')
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage("Durum 'todo', 'in-progress' veya 'done' olmalıdır"),
];

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Tek bir görevin detaylarını getirir
 *     tags: [Tasks]
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
 *         description: Görev detayları getirildi
 *       404:
 *         description: Görev bulunamadı
 */
router.get('/:id', getTaskById);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Görev bilgilerini günceller
 *     tags: [Tasks]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, done]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               assignee:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Görev güncellendi
 */
router.put('/:id', updateTaskRules, validate, updateTask);

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     summary: Görev durumunu hızlıca değiştirir (todo / in-progress / done)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, done]
 *                 example: in-progress
 *     responses:
 *       200:
 *         description: Durum güncellendi
 */
router.patch('/:id/status', updateStatusRules, validate, updateTaskStatus);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Görevi ve bağlı dosya eklerini siler
 *     tags: [Tasks]
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
 *         description: Görev silindi
 */
router.delete('/:id', deleteTask);

/**
 * @swagger
 * /tasks/{id}/attachments:
 *   post:
 *     summary: Göreve dosya eki yükler (Multer)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Yüklenecek dosya (Görsel, PDF, Doc, Zip vb.)
 *     responses:
 *       201:
 *         description: Dosya başarıyla yüklendi
 *       400:
 *         description: Dosya seçilmedi veya geçersiz dosya türü
 */
router.post('/:id/attachments', upload.single('file'), uploadAttachment);

/**
 * @swagger
 * /tasks/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Görevden dosya ekini siler
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dosya eki silindi
 */
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

module.exports = router;
