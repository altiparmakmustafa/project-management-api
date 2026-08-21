const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Yardımcı: Kullanıcının projedeki rolünü bulur ve yetkisini doğrular
const checkProjectAccess = async (projectId, userId, requireWriteAccess = false) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  let role = null;
  if (project.owner.toString() === userId.toString()) {
    role = 'owner';
  } else {
    const member = project.members.find(
      (m) => m.user.toString() === userId.toString()
    );
    if (member) {
      role = member.role;
    }
  }

  if (!role) {
    throw new ApiError(403, 'Bu projenin görevlerine erişim yetkiniz bulunmamaktadır.');
  }

  // Eğer yazma/güncelleme yetkisi gerekiyorsa ve kullanıcı 'viewer' ise engelle
  if (requireWriteAccess && role === 'viewer') {
    throw new ApiError(403, 'İzleyici (viewer) rolündeki üyeler görevler üzerinde değişiklik yapamaz.');
  }

  return { project, role };
};

/**
 * @desc    Projeye yeni bir görev ekler
 * @route   POST /api/v1/projects/:projectId/tasks
 * @access  Private (Owner, Admin, Member)
 */
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, status, priority, assignee, tags, dueDate } = req.body;

  const { project } = await checkProjectAccess(projectId, req.user._id, true);

  // Eğer atanan kişi belirtilmişse, o kişinin proje üyesi olduğunu doğrula
  if (assignee) {
    const isAssigneeMember =
      project.owner.toString() === assignee.toString() ||
      project.members.some((m) => m.user.toString() === assignee.toString());

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
 * @access  Private (Owner, Admin, Member, Viewer)
 */
const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assignee, tag, search } = req.query;

  await checkProjectAccess(projectId, req.user._id, false);

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
 * @access  Private (Owner, Admin, Member, Viewer)
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

  await checkProjectAccess(task.project._id, req.user._id, false);

  res.status(200).json(
    new ApiResponse(200, task, 'Görev detayları getirildi')
  );
});

/**
 * @desc    Görevi günceller
 * @route   PUT /api/v1/tasks/:id
 * @access  Private (Owner, Admin, Member)
 */
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, assignee, tags, dueDate } = req.body;

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  const { project } = await checkProjectAccess(task.project, req.user._id, true);

  if (assignee !== undefined) {
    if (assignee) {
      const isAssigneeMember =
        project.owner.toString() === assignee.toString() ||
        project.members.some((m) => m.user.toString() === assignee.toString());

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
 * @access  Private (Owner, Admin, Member)
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

  await checkProjectAccess(task.project, req.user._id, true);

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
 * @access  Private (Owner, Admin veya Görevi Oluşturan)
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  const { role } = await checkProjectAccess(task.project, req.user._id, true);
  const isCreator = task.createdBy.toString() === req.user._id.toString();

  if (role !== 'owner' && role !== 'admin' && !isCreator) {
    throw new ApiError(403, 'Yalnızca proje yöneticileri veya görevi oluşturan kişi silebilir.');
  }

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
 * @access  Private (Owner, Admin, Member)
 */
const uploadAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    throw new ApiError(400, 'Lütfen yüklenecek bir dosya seçiniz.');
  }

  const task = await Task.findById(id);
  if (!task) {
    fs.unlinkSync(req.file.path);
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  await checkProjectAccess(task.project, req.user._id, true);

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
 * @access  Private (Owner, Admin veya Görevi Oluşturan)
 */
const deleteAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Görev bulunamadı.');
  }

  const { role } = await checkProjectAccess(task.project, req.user._id, true);
  const isCreator = task.createdBy.toString() === req.user._id.toString();

  if (role !== 'owner' && role !== 'admin' && !isCreator) {
    throw new ApiError(403, 'Yalnızca proje yöneticileri veya görevi oluşturan kişi dosya ekini silebilir.');
  }

  const attachment = task.attachments.id(attachmentId);
  if (!attachment) {
    throw new ApiError(404, 'Dosya eki bulunamadı.');
  }

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
