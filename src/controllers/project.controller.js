const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { emitMemberAdded } = require('../services/socket.service');

// Yardımcı: Kullanıcının projedeki rolünü bulur ('owner' | 'admin' | 'member' | 'viewer' | null)
const getUserProjectRole = (project, userId) => {
  if (project.owner.toString() === userId.toString()) {
    return 'owner';
  }
  const member = project.members.find(
    (m) => (m.user._id ? m.user._id.toString() : m.user.toString()) === userId.toString()
  );
  return member ? member.role : null;
};

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
    members: [
      {
        user: req.user._id,
        role: 'admin',
      },
    ],
  });

  await project.populate('owner', 'name email avatar title role');
  await project.populate('members.user', 'name email avatar title role');

  res.status(201).json(
    new ApiResponse(201, project, 'Proje başarıyla oluşturuldu')
  );
});

/**
 * @desc    Kullanıcının dahil olduğu tüm projeleri listeler
 * @route   GET /api/v1/projects
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {
    $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
  };

  if (status) {
    filter.status = status;
  }

  const projects = await Project.find(filter)
    .populate('owner', 'name email avatar title')
    .populate('members.user', 'name email avatar title')
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
    .populate('members.user', 'name email avatar title')
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

  const role = getUserProjectRole(project, req.user._id);
  if (!role) {
    throw new ApiError(403, 'Bu projeyi görüntüleme yetkiniz yok.');
  }

  const projectData = project.toJSON();
  projectData.currentUserRole = role;

  res.status(200).json(
    new ApiResponse(200, projectData, 'Proje detayları getirildi')
  );
});

/**
 * @desc    Projeyi günceller (Başlık, Açıklama, Renk, Durum)
 * @route   PUT /api/v1/projects/:id
 * @access  Private (Sahip veya Proje Admini)
 */
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, color, status } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  const role = getUserProjectRole(project, req.user._id);
  if (role !== 'owner' && role !== 'admin') {
    throw new ApiError(403, 'Yalnızca proje sahibi veya yöneticisi projeyi güncelleyebilir.');
  }

  if (title) project.title = title;
  if (description !== undefined) project.description = description;
  if (color) project.color = color;
  if (status) project.status = status;

  await project.save();
  await project.populate('owner', 'name email avatar title');
  await project.populate('members.user', 'name email avatar title');

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

  await Task.deleteMany({ project: id });
  await project.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Proje ve ilişkili tüm görevler başarıyla silindi')
  );
});

/**
 * @desc    Projeye yeni üye ekler (Rol belirterek: admin, member, viewer)
 * @route   POST /api/v1/projects/:id/members
 * @access  Private (Sahip veya Proje Admini)
 */
const addMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, userId, role } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  const userRole = getUserProjectRole(project, req.user._id);
  if (userRole !== 'owner' && userRole !== 'admin') {
    throw new ApiError(403, 'Yalnızca proje sahibi veya yöneticisi üye ekleyebilir.');
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

  // Zaten üye mi kontrolü
  const isAlreadyMember = project.members.some(
    (m) => m.user.toString() === userToAdd._id.toString()
  );

  if (isAlreadyMember) {
    throw new ApiError(400, 'Bu kullanıcı zaten projenin bir üyesi.');
  }

  project.members.push({
    user: userToAdd._id,
    role: role || 'member',
    joinedAt: new Date(),
  });

  await project.save();
  await project.populate('owner', 'name email avatar title');
  await project.populate('members.user', 'name email avatar title');

  // Socket.io Event Yayını: member:added
  emitMemberAdded(
    id,
    {
      user: {
        _id: userToAdd._id,
        name: userToAdd.name,
        email: userToAdd.email,
        title: userToAdd.title,
        avatar: userToAdd.avatar,
      },
      role: role || 'member',
    },
    req.user
  );

  res.status(200).json(
    new ApiResponse(
      200,
      project,
      `${userToAdd.name} (${role || 'member'} rolüyle) başarıyla projeye eklendi`
    )
  );
});

/**
 * @desc    Projedeki bir üyenin rolünü günceller (admin, member, viewer)
 * @route   PUT /api/v1/projects/:id/members/:userId/role
 * @access  Private (Sahip veya Proje Admini)
 */
const updateMemberRole = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const { role } = req.body;

  if (!['admin', 'member', 'viewer'].includes(role)) {
    throw new ApiError(400, "Rol 'admin', 'member' veya 'viewer' olmalıdır.");
  }

  const project = await Project.findById(id);
  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  const currentUserRole = getUserProjectRole(project, req.user._id);
  if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
    throw new ApiError(403, 'Yalnızca proje sahibi veya yöneticisi üye rollerini değiştirebilir.');
  }

  // Proje sahibinin rolü değiştirilemez
  if (project.owner.toString() === userId) {
    throw new ApiError(400, 'Proje sahibinin rolü değiştirilemez.');
  }

  const memberIndex = project.members.findIndex(
    (m) => m.user.toString() === userId
  );

  if (memberIndex === -1) {
    throw new ApiError(404, 'Kullanıcı bu projenin üyesi değil.');
  }

  project.members[memberIndex].role = role;
  await project.save();

  await project.populate('owner', 'name email avatar title');
  await project.populate('members.user', 'name email avatar title');

  res.status(200).json(
    new ApiResponse(200, project, 'Üye rolü başarıyla güncellendi')
  );
});

/**
 * @desc    Projeden üye çıkarır veya üye projeden ayrılır
 * @route   DELETE /api/v1/projects/:id/members/:userId
 * @access  Private (Sahip, Admin veya Üyenin Kendisi)
 */
const removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, 'Proje bulunamadı.');
  }

  const currentUserRole = getUserProjectRole(project, req.user._id);
  const isSelf = req.user._id.toString() === userId;

  if (currentUserRole !== 'owner' && currentUserRole !== 'admin' && !isSelf) {
    throw new ApiError(403, 'Bu işlem için yetkiniz bulunmamaktadır.');
  }

  if (project.owner.toString() === userId) {
    throw new ApiError(400, 'Proje sahibi projeden çıkarılamaz. Önce projeyi devretmeli veya silmelisiniz.');
  }

  const isMember = project.members.some((m) => m.user.toString() === userId);
  if (!isMember) {
    throw new ApiError(404, 'Kullanıcı bu projenin üyesi değil.');
  }

  project.members = project.members.filter((m) => m.user.toString() !== userId);
  await project.save();

  // Görev atamalarını temizle
  await Task.updateMany({ project: id, assignee: userId }, { assignee: null });

  await project.populate('owner', 'name email avatar title');
  await project.populate('members.user', 'name email avatar title');

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
  updateMemberRole,
  removeMember,
};
