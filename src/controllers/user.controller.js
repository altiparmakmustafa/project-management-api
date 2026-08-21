const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Tüm kullanıcıları listeler (Arama, filtreleme ve sayfalama ile)
 * @route   GET /api/v1/users
 * @access  Private (Sadece Admin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { search, role, isActive, page = 1, limit = 10 } = req.query;

  const query = {};

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
      'Kullanıcılar başarıyla listelendi'
    )
  );
});

/**
 * @desc    Tek bir kullanıcının detaylarını ve istatistiklerini getirir
 * @route   GET /api/v1/users/:id
 * @access  Private (Sadece Admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Kullanıcı bulunamadı.');
  }

  // Kullanıcının sahip olduğu projeler ve atandığı görev sayıları
  const [ownedProjectsCount, assignedTasksCount] = await Promise.all([
    Project.countDocuments({ owner: id }),
    Task.countDocuments({ assignee: id }),
  ]);

  const userData = user.toJSON();
  userData.stats = {
    ownedProjectsCount,
    assignedTasksCount,
  };

  res.status(200).json(
    new ApiResponse(200, userData, 'Kullanıcı detayları getirildi')
  );
});

/**
 * @desc    Kullanıcı bilgilerini, rolünü ve durumunu günceller (Admin)
 * @route   PUT /api/v1/users/:id
 * @access  Private (Sadece Admin)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, title, avatar, role, isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Kullanıcı bulunamadı.');
  }

  // Admin kendi kendini pasife alamaz veya adminliğini kaldıramaz
  if (req.user._id.toString() === id) {
    if (isActive === false) {
      throw new ApiError(400, 'Kendi hesabınızı pasife alamazsınız.');
    }
    if (role && role !== 'admin') {
      throw new ApiError(400, 'Kendi adminlik yetkinizi kaldıramazsınız.');
    }
  }

  if (name) user.name = name;
  if (title !== undefined) user.title = title;
  if (avatar !== undefined) user.avatar = avatar;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.status(200).json(
    new ApiResponse(200, user, 'Kullanıcı başarıyla güncellendi')
  );
});

/**
 * @desc    Kullanıcıyı siler (Admin)
 * @route   DELETE /api/v1/users/:id
 * @access  Private (Sadece Admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user._id.toString() === id) {
    throw new ApiError(400, 'Kendi hesabınızı silemezsiniz.');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Kullanıcı bulunamadı.');
  }

  // Kullanıcının görev atamalarını temizle
  await Task.updateMany({ assignee: id }, { assignee: null });

  // Kullanıcının üye olduğu projelerden çıkar
  await Project.updateMany(
    { 'members.user': id },
    { $pull: { members: { user: id } } }
  );

  await user.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Kullanıcı başarıyla silindi')
  );
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
