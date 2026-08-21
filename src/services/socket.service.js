const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

/**
 * Socket.io sunucusunu HTTP sunucusuna bağlar ve event listener'ları kurar
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  // İsteğe bağlı: Socket bağlantısında JWT kimlik doğrulama middleware'i
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('name email avatar title role');
        if (user) {
          socket.user = user;
        }
      }
      next();
    } catch (error) {
      // Kimliksiz soket bağlantılarına da izin veriyoruz, kullanıcı nesnesi olmadan bağlanır
      next();
    }
  });

  io.on('connection', (socket) => {
    const userName = socket.user ? socket.user.name : 'Anonim İstemci';
    console.log(`[Socket.io] 🟢 Yeni istemci bağlandı: ${socket.id} (${userName})`);

    // 1. Proje odasına katılma (Join Project Room)
    socket.on('join:project', (projectId) => {
      if (projectId) {
        const roomName = `project:${projectId}`;
        socket.join(roomName);
        console.log(`[Socket.io] 🚪 ${userName} (${socket.id}) ${roomName} odasına katıldı.`);
        
        socket.emit('joined:project', {
          success: true,
          projectId,
          message: `${projectId} nolu proje odasına başarıyla katıldınız.`,
        });
      }
    });

    // 2. Proje odasından ayrılma (Leave Project Room)
    socket.on('leave:project', (projectId) => {
      if (projectId) {
        const roomName = `project:${projectId}`;
        socket.leave(roomName);
        console.log(`[Socket.io] 🚪 ${userName} (${socket.id}) ${roomName} odasından ayrıldı.`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] 🔴 İstemci ayrıldı: ${socket.id} (Sebep: ${reason})`);
    });
  });

  return io;
};

/**
 * Mevcut Socket.io nesnesini döner
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io henüz başlatılmadı!');
  }
  return io;
};

// ==========================================
// GERÇEK ZAMANLI EVENT YAYIN YARDIMCILARI
// ==========================================

/**
 * Görev oluşturulduğunda proje odasına yayın yapar
 */
const emitTaskCreated = (projectId, task, createdBy) => {
  if (!io) return;
  const roomName = `project:${projectId}`;
  io.to(roomName).emit('task:created', {
    type: 'TASK_CREATED',
    projectId,
    task,
    createdBy,
    timestamp: new Date().toISOString(),
  });
  console.log(`[Socket.io] 📢 Event yayınlandı: task:created -> ${roomName}`);
};

/**
 * Görev güncellendiğinde proje odasına yayın yapar
 */
const emitTaskUpdated = (projectId, task, updatedBy) => {
  if (!io) return;
  const roomName = `project:${projectId}`;
  io.to(roomName).emit('task:updated', {
    type: 'TASK_UPDATED',
    projectId,
    task,
    updatedBy,
    timestamp: new Date().toISOString(),
  });
  console.log(`[Socket.io] 📢 Event yayınlandı: task:updated -> ${roomName}`);
};

/**
 * Görev durumu değiştiğinde (todo -> in-progress -> done) proje odasına yayın yapar
 */
const emitTaskStatusChanged = (projectId, task, oldStatus, newStatus, updatedBy) => {
  if (!io) return;
  const roomName = `project:${projectId}`;
  io.to(roomName).emit('task:status_changed', {
    type: 'TASK_STATUS_CHANGED',
    projectId,
    taskId: task._id,
    taskTitle: task.title,
    oldStatus,
    newStatus,
    task,
    updatedBy,
    timestamp: new Date().toISOString(),
  });
  console.log(`[Socket.io] 📢 Event yayınlandı: task:status_changed (${oldStatus} -> ${newStatus}) -> ${roomName}`);
};

/**
 * Görev silindiğinde proje odasına yayın yapar
 */
const emitTaskDeleted = (projectId, taskId, deletedBy) => {
  if (!io) return;
  const roomName = `project:${projectId}`;
  io.to(roomName).emit('task:deleted', {
    type: 'TASK_DELETED',
    projectId,
    taskId,
    deletedBy,
    timestamp: new Date().toISOString(),
  });
  console.log(`[Socket.io] 📢 Event yayınlandı: task:deleted -> ${roomName}`);
};

/**
 * Göreve dosya eklendiğinde proje odasına yayın yapar
 */
const emitAttachmentAdded = (projectId, taskId, attachment, uploadedBy) => {
  if (!io) return;
  const roomName = `project:${projectId}`;
  io.to(roomName).emit('attachment:added', {
    type: 'ATTACHMENT_ADDED',
    projectId,
    taskId,
    attachment,
    uploadedBy,
    timestamp: new Date().toISOString(),
  });
  console.log(`[Socket.io] 📢 Event yayınlandı: attachment:added -> ${roomName}`);
};

/**
 * Projeye yeni üye eklendiğinde proje odasına yayın yapar
 */
const emitMemberAdded = (projectId, member, addedBy) => {
  if (!io) return;
  const roomName = `project:${projectId}`;
  io.to(roomName).emit('member:added', {
    type: 'MEMBER_ADDED',
    projectId,
    member,
    addedBy,
    timestamp: new Date().toISOString(),
  });
  console.log(`[Socket.io] 📢 Event yayınlandı: member:added -> ${roomName}`);
};

module.exports = {
  initSocket,
  getIO,
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskStatusChanged,
  emitTaskDeleted,
  emitAttachmentAdded,
  emitMemberAdded,
};
