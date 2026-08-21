const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Nodemailer taşıyıcısını (transporter) başlatır
 * Eğer .env dosyasında SMTP bilgileri yoksa test için otomatik Ethereal hesabı oluşturur
 */
const initTransporter = async () => {
  if (transporter) return transporter;

  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('[Nodemailer] 📧 Özel SMTP sunucusu yapılandırıldı.');
    } else {
      // Test amaçlı otomatik Ethereal Email hesabı oluştur
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Nodemailer] 📧 Ethereal Test SMTP hesabı hazırlandı: ${testAccount.user}`);
    }
  } catch (error) {
    console.error(`[Nodemailer] ❌ Taşıyıcı oluşturma hatası: ${error.message}`);
  }

  return transporter;
};

/**
 * Görev bir kullanıcıya atandığında e-posta bildirimi gönderir
 */
const sendTaskAssignmentEmail = async ({ assignee, task, project, assigner }) => {
  try {
    const mailTransporter = await initTransporter();
    if (!mailTransporter || !assignee || !assignee.email) return;

    const priorityColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#7c3aed',
    };

    const priorityColor = priorityColors[task.priority] || '#3b82f6';
    const dueDateFormatted = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Belirtilmedi';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">🎯 Yeni Bir Görev Size Atandı</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">${project.title} projesinde yeni bir görev aldınız.</p>
        </div>
        
        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">Merhaba <strong>${assignee.name}</strong>,</p>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
            <strong>${assigner.name}</strong> tarafından size yeni bir görev atandı:
          </p>

          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #1e293b;">${task.title}</h2>
            <p style="margin: 0 0 14px 0; font-size: 14px; color: #475569; line-height: 1.5;">
              ${task.description || 'Görev için herhangi bir açıklama girilmedi.'}
            </p>
            
            <div style="display: flex; gap: 12px; font-size: 13px;">
              <span style="background-color: ${priorityColor}20; color: ${priorityColor}; padding: 4px 10px; border-radius: 9999px; font-weight: 600;">
                Öncelik: ${task.priority ? task.priority.toUpperCase() : 'MEDIUM'}
              </span>
              <span style="background-color: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 9999px; font-weight: 600;">
                Bitiş Tarihi: ${dueDateFormatted}
              </span>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="http://localhost:5001/api/v1/tasks/${task._id}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
              Görevi Panoda Görüntüle ➔
            </a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          Bu e-posta Trello Benzeri Proje & Görev Yönetim Sistemi tarafından otomatik olarak gönderilmiştir.
        </div>
      </div>
    `;

    const mailOptions = {
      from: '"Proje Yönetim Sistemi" <noreply@taskmanager.local>',
      to: assignee.email,
      subject: `🎯 Size Yeni Bir Görev Atandı: ${task.title}`,
      text: `Merhaba ${assignee.name},\n\n${project.title} projesinde '${task.title}' başlıklı görev size atandı.\n\nÖncelik: ${task.priority}\nBitiş: ${dueDateFormatted}\n\nDetaylar: http://localhost:5001/api/v1/tasks/${task._id}`,
      html: htmlContent,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[Nodemailer] ✉️ Görev atama e-postası gönderildi: ${assignee.email} (MessageId: ${info.messageId})`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Nodemailer] 🔗 Ethereal E-posta Önizleme URL'i: ${previewUrl}`);
    }

    return { info, previewUrl };
  } catch (error) {
    console.error(`[Nodemailer] ❌ E-posta gönderim hatası: ${error.message}`);
    // E-posta hatası ana akışı engellemesin
    return null;
  }
};

module.exports = {
  initTransporter,
  sendTaskAssignmentEmail,
};
