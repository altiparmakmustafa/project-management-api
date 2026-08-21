const express = require('express');
const { body, param } = require('express-validator');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/project.controller');
const {
  createTask,
  getTasksByProject,
} = require('../controllers/task.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Tüm proje rotaları JWT doğrulaması gerektirir
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Proje Oluşturma, Listeleme ve Üye Yönetimi
 */

// Validasyon kuralları
const createProjectRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Proje başlığı zorunludur')
    .isLength({ max: 100 })
    .withMessage('Proje başlığı en fazla 100 karakter olabilir'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Açıklama en fazla 500 karakter olabilir'),
  body('color')
    .optional()
    .isHexColor()
    .withMessage('Renk geçerli bir HEX kodu olmalıdır (örn: #3b82f6)'),
];

const updateProjectRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Proje başlığı en fazla 100 karakter olabilir'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Açıklama en fazla 500 karakter olabilir'),
  body('status')
    .optional()
    .isIn(['active', 'archived', 'completed'])
    .withMessage("Durum 'active', 'archived' veya 'completed' olmalıdır"),
  body('color')
    .optional()
    .isHexColor()
    .withMessage('Renk geçerli bir HEX kodu olmalıdır'),
];

const addMemberRules = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Geçerli bir Kullanıcı ID giriniz'),
];

const createTaskRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Görev başlığı zorunludur')
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
    .withMessage('Geçerli bir atanan kullanıcı ID giriniz'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Etiketler bir dizi (array) olmalıdır'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Bitiş tarihi geçerli bir ISO8601 tarih formatı olmalıdır'),
];

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Yeni proje oluşturur
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: E-Ticaret Mobil Uygulaması
 *               description:
 *                 type: string
 *                 example: Flutter ve Node.js ile geliştirilen mobil uygulama
 *               color:
 *                 type: string
 *                 example: "#6366f1"
 *     responses:
 *       201:
 *         description: Proje oluşturuldu
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/', createProjectRules, validate, createProject);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Giriş yapan kullanıcının dahil olduğu projeleri listeler
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, completed]
 *         description: Proje durumuna göre filtreleme
 *     responses:
 *       200:
 *         description: Proje listesi getirildi
 */
router.get('/', getProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Proje detaylarını ve içindeki görevleri getirir
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Proje ID
 *     responses:
 *       200:
 *         description: Proje detayları getirildi
 *       404:
 *         description: Proje bulunamadı
 */
router.get('/:id', getProjectById);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Projeyi günceller (Sadece sahip)
 *     tags: [Projects]
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
 *                 enum: [active, archived, completed]
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proje güncellendi
 */
router.put('/:id', updateProjectRules, validate, updateProject);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Projeyi ve bağlı tüm görevleri siler (Sadece sahip)
 *     tags: [Projects]
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
 *         description: Proje silindi
 */
router.delete('/:id', deleteProject);

/**
 * @swagger
 * /projects/{id}/members:
 *   post:
 *     summary: Projeye yeni üye ekler (Sadece sahip)
 *     tags: [Projects]
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
 *             properties:
 *               email:
 *                 type: string
 *                 example: ali.yilmaz@example.com
 *               userId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *     responses:
 *       200:
 *         description: Üye eklendi
 */
router.post('/:id/members', addMemberRules, validate, addMember);

/**
 * @swagger
 * /projects/{id}/members/{userId}:
 *   delete:
 *     summary: Projeden üye çıkarır veya üye projeden ayrılır
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Üye çıkarıldı
 */
router.delete('/:id/members/:userId', removeMember);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Proje içerisine yeni bir görev ekler
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Login Ekranı UI Tasarımı
 *               description:
 *                 type: string
 *                 example: Figma'daki yeni tasarıma uygun login formunu kodla
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, done]
 *                 example: todo
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: high
 *               assignee:
 *                 type: string
 *                 example: 6a881f505be7fdd5d976c66a
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["frontend", "ui", "auth"]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-09-01T18:00:00.000Z
 *     responses:
 *       201:
 *         description: Görev oluşturuldu
 */
router.post('/:projectId/tasks', createTaskRules, validate, createTask);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: Projeye ait görevleri filtreler ile listeler
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in-progress, done]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Başlık veya açıklamada arama
 *     responses:
 *       200:
 *         description: Görev listesi getirildi
 */
router.get('/:projectId/tasks', getTasksByProject);

module.exports = router;
