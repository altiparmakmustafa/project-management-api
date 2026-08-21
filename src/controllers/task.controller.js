const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Yardımcı: Kullanıcının projeye erişim yetkisini kontrol eder
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  const isMember =
    project.owner.toString() === userId.toString() ||
    project.members.some((m) => m.toString() === userId.toString());

  if (!isMember) {
    throw new ApiError(403, 'Bu projenin görevlerine erişim yetkiniz bulunmamaktadır.');
  }

  return project;
};

/**
 * @desc    Projeye yeni bir görev ekler
 * @route   POST /api/v1/projects/:projectId/tasks
 * @access  Private (Proje Üyeleri)
 */
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, status, priority, assignee, tags, dueDate } = req.body;

  const project = await checkProjectAccess(projectId, req.user._id);

  // Eğer atanan kişi (assignee) belirtilmişse, o kişinin proje üyesi olduğunu doğrula
  if (assignee) {
    const isAssigneeMember =
      project.owner.toString() === assignee.toString() ||
      project.members.some((m) => m.toString() === assignee.toString());

    if (!isAssigneeMember) {
      throw new ApiError(400, 'Görev yalnızca proje üyelerine atanabilir.');
    }
  }

  const task = await Task.create({
    title,
    description,
    status: status || 'todo',
    priority: priority || 'medium',
    project: projectId,
    assignee: assignee || null,
    createdBy: req.user._id,
    tags: tags || [],
    dueDate: dueDate || null,
  });

  await task.populate('assignee', 'name email avatar title');
  await task.populate('createdBy', 'name email avatar title');
  await task.populate('project', 'title color');

  res.status(201).json(
    new ApiResponse(201, task, 'Görev başarıyla oluşturuldu')
  );
});

/**
 * @desc    Bir projenin görevlerini filtrelerle listeler
 * @route   GET /api/v1/projects/:projectId/tasks
 * @access  Private
 */
const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assignee, tag, search } = req.query;

  await checkProjectAccess(projectId, req.user._id);

  const filter = { project: projectId };

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;
  if (tag) filter.tags = tag;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const tasks = await Task.find(filter)
    .populate('assignee', 'name email avatar title')
    .populate('createdBy', 'name email avatar title')
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, tasks, 'Görevler başarıyla listelendi')
  );
});

/**
 * @desc    Tek bir görevin detaylarını getirir
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id)
    .populate('assignee', 'name email avatar title')
    .populate('createdBy', 'name email avatar title')
    .populate('project', 'title color owner members');

  if (!task) {
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  await checkProjectAccess(task.project._id, req.user._id);

  res.status(200).json(
    new ApiResponse(200, task, 'Görev detayları getirildi')
  );
});

/**
 * @desc    Görevi günceller
 * @route   PUT /api/v1/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, assignee, tags, dueDate } = req.body;

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  const project = await checkProjectAccess(task.project, req.user._id);

  if (assignee !== undefined) {
    if (assignee) {
      const isAssigneeMember =
        project.owner.toString() === assignee.toString() ||
        project.members.some((m) => m.toString() === assignee.toString());

      if (!isAssigneeMember) {
        throw new ApiError(400, 'Görev yalnızca proje üyelerine atanabilir.');
      }
      task.assignee = assignee;
    } else {
      task.assignee = null;
    }
  }

  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (tags) task.tags = tags;
  if (dueDate !== undefined) task.dueDate = dueDate;

  await task.save();
  await task.populate('assignee', 'name email avatar title');
  await task.populate('createdBy', 'name email avatar title');
  await task.populate('project', 'title color');

  res.status(200).json(
    new ApiResponse(200, task, 'Görev başarıyla güncellendi')
  );
});

/**
 * @desc    Görevin durumunu hızlıca değiştirir (todo / in-progress / done)
 * @route   PATCH /api/v1/tasks/:id/status
 * @access  Private
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['todo', 'in-progress', 'done'].includes(status)) {
    throw new ApiError(400, "Geçersiz durum. 'todo', 'in-progress' veya 'done' olmalıdır.");
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  await checkProjectAccess(task.project, req.user._id);

  task.status = status;
  await task.save();

  await task.populate('assignee', 'name email avatar title');
  await task.populate('createdBy', 'name email avatar title');
  await task.populate('project', 'title color');

  res.status(200).json(
    new ApiResponse(200, task, `Görev durumu '${status}' olarak güncellendi`)
  );
});

/**
 * @desc    Görevi ve ekli dosyalarını siler
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  await checkProjectAccess(task.project, req.user._id);

  // Sunucudaki fiziksel dosya eklerini temizle
  if (task.attachments && task.attachments.length > 0) {
    task.attachments.forEach((att) => {
      const filePath = path.join(__dirname, '../../uploads', att.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }

  await task.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Görev başarıyla silindi')
  );
});

/**
 * @desc    Göreve dosya eki yükler (Multer)
 * @route   POST /api/v1/tasks/:id/attachments
 * @access  Private
 */
const uploadAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    throw new ApiError(400, 'Lütfen yüklenecek bir dosya seçiniz.');
  }

  const task = await Task.findById(id);
  if (!task) {
    // Yüklenen dosyayı geri sil
    fs.unlinkSync(req.file.path);
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  await checkProjectAccess(task.project, req.user._id);

  const newAttachment = {
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date(),
  };

  task.attachments.push(newAttachment);
  await task.save();

  res.status(201).json(
    new ApiResponse(201, task, 'Dosya eki başarıyla yüklendi')
  );
});

/**
 * @desc    Görevden dosya eki siler
 * @route   DELETE /api/v1/tasks/:id/attachments/:attachmentId
 * @access  Private
 */
const deleteAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  await checkProjectAccess(task.project, req.user._id);

  const attachment = task.attachments.id(attachmentId);
  if (!attachment) {
    throw new ApiError(404, 'Dosya eki bulunamadı.');
  }

  // Fiziksel dosyayı sunucudan sil
  const filePath = path.join(__dirname, '../../uploads', attachment.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  task.attachments.pull(attachmentId);
  await task.save();

  res.status(200).json(
    new ApiResponse(200, task, 'Dosya eki başarıyla silindi')
  );
});

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  uploadAttachment,
  deleteAttachment,
};
