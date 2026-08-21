const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Yeni bir proje oluşturur
 * @route   POST /api/v1/projects
 * @access  Private
 */
const createProject = asyncHandler(async (req, res) => {
  const { title, description, color } = req.body;

  const project = await Project.create({
    title,
    description,
    color,
    owner: req.user._id,
    members: [req.user._id], // Oluşturan kişi otomatik olarak ilk üyedir
  });

  await project.populate('owner', 'name email avatar title');
  await project.populate('members', 'name email avatar title');

  res.status(201).json(
    new ApiResponse(201, project, 'Proje başarıyla oluşturuldu')
  );
});

/**
 * @desc    Kullanıcının sahibi veya üyesi olduğu tüm projeleri listeler
 * @route   GET /api/v1/projects
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  };

  if (status) {
    filter.status = status;
  }

  const projects = await Project.find(filter)
    .populate('owner', 'name email avatar title')
    .populate('members', 'name email avatar title')
    .sort({ updatedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, projects, 'Projeler başarıyla getirildi')
  );
});

/**
 * @desc    Tek bir projenin detaylarını ve görevlerini getirir
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate('owner', 'name email avatar title')
    .populate('members', 'name email avatar title')
    .populate({
      path: 'tasks',
      populate: [
        { path: 'assignee', select: 'name email avatar title' },
        { path: 'createdBy', select: 'name email avatar title' },
      ],
    });

  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  // Kullanıcı üye veya sahip mi kontrolü
  const isMember =
    project.owner._id.toString() === req.user._id.toString() ||
    project.members.some((m) => m._id.toString() === req.user._id.toString());

  if (!isMember) {
    throw new ApiError(403, 'Bu projeyi görüntüleme yetkiniz yok.');
  }

  res.status(200).json(
    new ApiResponse(200, project, 'Proje detayları getirildi')
  );
});

/**
 * @desc    Projeyi günceller (Başlık, Açıklama, Renk, Durum)
 * @route   PUT /api/v1/projects/:id
 * @access  Private (Sadece Sahip)
 */
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, color, status } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Sadece proje sahibi projeyi güncelleyebilir.');
  }

  if (title) project.title = title;
  if (description !== undefined) project.description = description;
  if (color) project.color = color;
  if (status) project.status = status;

  await project.save();
  await project.populate('owner', 'name email avatar title');
  await project.populate('members', 'name email avatar title');

  res.status(200).json(
    new ApiResponse(200, project, 'Proje başarıyla güncellendi')
  );
});

/**
 * @desc    Projeyi ve projeye ait tüm görevleri siler
 * @route   DELETE /api/v1/projects/:id
 * @access  Private (Sadece Sahip)
 */
const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Sadece proje sahibi projeyi silebilir.');
  }

  // Projeye ait tüm görevleri sil
  await Task.deleteMany({ project: id });
  await project.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Proje ve ilişkili tüm görevler başarıyla silindi')
  );
});

/**
 * @desc    Projeye yeni üye ekler (E-posta veya Kullanıcı ID ile)
 * @route   POST /api/v1/projects/:id/members
 * @access  Private (Sadece Sahip)
 */
const addMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, userId } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  if (project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Yalnızca proje sahibi yeni üye ekleyebilir.');
  }

  let userToAdd;
  if (email) {
    userToAdd = await User.findOne({ email });
  } else if (userId) {
    userToAdd = await User.findById(userId);
  }

  if (!userToAdd) {
    throw new ApiError(404, 'Eklenecek kullanıcı bulunamadı.');
  }

  // Zaten üye mi?
  if (project.members.some((m) => m.toString() === userToAdd._id.toString())) {
    throw new ApiError(400, 'Bu kullanıcı zaten projenin bir üyesi.');
  }

  project.members.push(userToAdd._id);
  await project.save();

  await project.populate('owner', 'name email avatar title');
  await project.populate('members', 'name email avatar title');

  res.status(200).json(
    new ApiResponse(200, project, `${userToAdd.name} başarıyla projeye eklendi`)
  );
});

/**
 * @desc    Projeden üye çıkarır veya üye projeden ayrılır
 * @route   DELETE /api/v1/projects/:id/members/:userId
 * @access  Private (Sahip veya Üyenin Kendisi)
 */
const removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  const isOwner = project.owner.toString() === req.user._id.toString();
  const isSelf = req.user._id.toString() === userId;

  if (!isOwner && !isSelf) {
    throw new ApiError(403, 'Bu işlem için yetkiniz bulunmamaktadır.');
  }

  // Proje sahibi kendini çıkaramaz
  if (project.owner.toString() === userId) {
    throw new ApiError(400, 'Proje sahibi projeden çıkarılamaz. Önce projeyi devretmeli veya silmelisiniz.');
  }

  // Üye mi kontrolü
  if (!project.members.some((m) => m.toString() === userId)) {
    throw new ApiError(404, 'Kullanıcı bu projenin üyesi değil.');
  }

  // Üyeyi listeden çıkar
  project.members = project.members.filter((m) => m.toString() !== userId);
  await project.save();

  // Çıkarılan kullanıcının bu projedeki görev atamalarını temizle
  await Task.updateMany({ project: id, assignee: userId }, { assignee: null });

  await project.populate('owner', 'name email avatar title');
  await project.populate('members', 'name email avatar title');

  res.status(200).json(
    new ApiResponse(200, project, 'Üye projeden başarıyla çıkarıldı')
  );
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
