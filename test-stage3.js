/**
 * ============================================================================
 * Aşama 3: Socket.io Gerçek Zamanlı Bildirimler & Nodemailer Uçtan Uca Test Scripti
 * ============================================================================
 * Çalıştırmak için: node test-stage3.js
 */

const { io } = require('socket.io-client');

const API_URL = 'http://localhost:5001/api/v1';
const SOCKET_URL = 'http://localhost:5001';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatTime = () => new Date().toLocaleTimeString('tr-TR');

async function runStage3Test() {
  console.log('======================================================================');
  console.log('🚀 AŞAMA 3: GERÇEK ZAMANLI SOCKET.IO & NODEMAILER TESTİ BAŞLATILIYOR');
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. ADIM: KULLANICI GİRİŞİ (LOGIN)
    // -------------------------------------------------------------------------
    console.log(`[${formatTime()}] [ADIM 1] 🔑 Kullanıcı girişi yapılıyor (ali.yilmaz@example.com)...`);
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ali.yilmaz@example.com',
        password: 'NewPassword1234',
      }),
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
      throw new Error(`Giriş başarısız: ${loginData.message}`);
    }

    const token = loginData.data.token;
    const user = loginData.data.user;
    console.log(`[${formatTime()}] ✅ Giriş Başarılı: ${user.name} (${user.email}) | Rol: ${user.role}`);
    console.log(`[${formatTime()}] 🎫 JWT Token: ${token.slice(0, 30)}...\n`);

    await sleep(800);

    // -------------------------------------------------------------------------
    // 2. ADIM: YENİ TEST PROJESİ OLUŞTURMA
    // -------------------------------------------------------------------------
    console.log(`[${formatTime()}] [ADIM 2] 📁 Yeni bir proje panosu oluşturuluyor...`);
    const projectRes = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: `Canlı Sprint Panosu (${new Date().toLocaleTimeString('tr-TR')})`,
        description: 'Socket.io ve Nodemailer canlı test panosu',
        color: '#6366f1',
      }),
    });

    const projectData = await projectRes.json();
    const projectId = projectData.data._id;
    console.log(`[${formatTime()}] ✅ Proje Oluşturuldu: "${projectData.data.title}"`);
    console.log(`[${formatTime()}] 🆔 Proje ID: ${projectId}\n`);

    await sleep(800);

    // -------------------------------------------------------------------------
    // 3. ADIM: SOCKET.IO İSTEMCİSİ BAĞLANTISI VE ODAYA KATILMA
    // -------------------------------------------------------------------------
    console.log(`[${formatTime()}] [ADIM 3] ⚡ Socket.io istemcisi bağlanıyor ve 'project:${projectId}' odasına katılıyor...`);
    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    await new Promise((resolve) => {
      socket.on('connect', () => {
        console.log(`[${formatTime()}] 🟢 Socket.io Sunucusuna Bağlandı (Socket ID: ${socket.id})`);
        socket.emit('join:project', projectId);
      });

      socket.on('joined:project', (data) => {
        console.log(`[${formatTime()}] 🚪 Proje Odasına Başarıyla Katıldı (Oda: project:${data.projectId})\n`);
        resolve();
      });
    });

    // Gerçek zamanlı olay dinleyicileri
    const receivedEvents = [];

    socket.on('member:added', (e) => {
      console.log(`\n  🔔 [CANLI SOCKET OLAYI ALINDI: member:added]`);
      console.log(`     👤 Eklenen Üye : ${e.member.user.name} (${e.member.user.email})`);
      console.log(`     🎖️  Üye Rolü    : ${e.member.role.toUpperCase()}`);
      console.log(`     👑 Ekleyen Kişi : ${e.addedBy.name}`);
      receivedEvents.push('member:added');
    });

    socket.on('task:created', (e) => {
      console.log(`\n  🔔 [CANLI SOCKET OLAYI ALINDI: task:created]`);
      console.log(`     📝 Görev Başlığı : "${e.task.title}"`);
      console.log(`     📊 Durum         : ${e.task.status.toUpperCase()}`);
      console.log(`     ⚡ Öncelik       : ${e.task.priority.toUpperCase()}`);
      console.log(`     👤 Oluşturan     : ${e.createdBy.name}`);
      receivedEvents.push('task:created');
    });

    socket.on('task:status_changed', (e) => {
      console.log(`\n  🔔 [CANLI SOCKET OLAYI ALINDI: task:status_changed]`);
      console.log(`     📝 Görev         : "${e.taskTitle}"`);
      console.log(`     🔄 Durum Geçişi  : ${e.oldStatus.toUpperCase()} ➔ ${e.newStatus.toUpperCase()}`);
      console.log(`     👤 Değiştiren    : ${e.updatedBy.name}`);
      receivedEvents.push('task:status_changed');
    });

    socket.on('task:deleted', (e) => {
      console.log(`\n  🔔 [CANLI SOCKET OLAYI ALINDI: task:deleted]`);
      console.log(`     🗑️  Silinen ID    : ${e.taskId}`);
      console.log(`     👤 Silen Kişi    : ${e.deletedBy.name}`);
      receivedEvents.push('task:deleted');
    });

    await sleep(800);

    // -------------------------------------------------------------------------
    // 4. ADIM: PROJEYE YENİ ÜYE EKLEME (member:added TETİKLENİR)
    // -------------------------------------------------------------------------
    console.log(`[${formatTime()}] [ADIM 4] 👥 Projeye Mustafa Altiparmak üye olarak ekleniyor...`);
    const addMemberRes = await fetch(`${API_URL}/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: 'mustafa.test@example.com',
        role: 'member',
      }),
    });
    const addMemberData = await addMemberRes.json();
    const mustafaUser = addMemberData.data.members.find(
      (m) => m.user.email === 'mustafa.test@example.com'
    );
    const mustafaId = mustafaUser.user._id;

    await sleep(1200);

    // -------------------------------------------------------------------------
    // 5. ADIM: GÖREV OLUŞTURMA VE ATAMA (task:created + NODEMAILER TETİKLENİR)
    // -------------------------------------------------------------------------
    console.log(`\n[${formatTime()}] [ADIM 5] 🎯 Yeni görev oluşturuluyor ve Mustafa'ya atanıyor...`);
    const createTaskRes = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Gerçek Zamanlı WebSocket ve Mail Entegrasyonu',
        description: 'Trello benzeri canlı bildirimler ve Nodemailer Ethereal e-posta servisi.',
        status: 'todo',
        priority: 'high',
        assignee: mustafaId,
        tags: ['socket.io', 'realtime', 'nodemailer'],
        dueDate: '2026-09-01T18:00:00.000Z',
      }),
    });
    const createTaskData = await createTaskRes.json();
    const taskId = createTaskData.data._id;

    await sleep(1500);

    // -------------------------------------------------------------------------
    // 6. ADIM: GÖREV DURUMUNU DEĞİŞTİRME (task:status_changed TETİKLENİR)
    // -------------------------------------------------------------------------
    console.log(`\n[${formatTime()}] [ADIM 6] 🔄 Görev durumu 'todo' dan 'in-progress' e güncelleniyor...`);
    await fetch(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: 'in-progress',
      }),
    });

    await sleep(1200);

    // -------------------------------------------------------------------------
    // 7. ADIM: GÖREVİ SİLME (task:deleted TETİKLENİR)
    // -------------------------------------------------------------------------
    console.log(`\n[${formatTime()}] [ADIM 7] 🗑️  Görev panodan siliniyor...`);
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await sleep(1000);

    // -------------------------------------------------------------------------
    // ÖZET VE SONUÇ
    // -------------------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`🏁 TEST BAŞARIYLA TAMAMLANDI!`);
    console.log(`📡 Yakalanan Canlı Socket Olayları (${receivedEvents.length}/4):`);
    receivedEvents.forEach((evt, idx) => console.log(`   ${idx + 1}. [${evt}]`));
    console.log('======================================================================\n');

    socket.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test sırasında hata oluştu:', error);
    process.exit(1);
  }
}

runStage3Test();
