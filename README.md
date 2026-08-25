# 🚀 Görev & Proje Yönetim API'si (Trello Benzeri)

Node.js ve Express ile geliştirilmiş; **JWT kimlik doğrulama**, **rol tabanlı proje ve pano yönetimi**, **gerçek zamanlı Socket.io bildirimleri**, **Multer ile dosya eki yükleme**, **Nodemailer e-posta bildirimleri** ve **interaktif Swagger UI dokümantasyonuna** sahip kurumsal seviyede RESTful API.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-v4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:5001/api-docs/)

---

## 📑 İçindekiler
1. [Öne Çıkan Özellikler](#-öne-çıkan-özellikler)
2. [Teknoloji Yığını](#-teknoloji-yığını)
3. [Klasör ve Mimari Yapısı](#-klasör-ve-mimari-yapısı)
4. [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
5. [Ortam Değişkenleri (.env)](#-ortam-değişkenleri-env)
6. [API Uç Noktaları (Endpoints)](#-api-uç-noktaları-endpoints)
7. [Gerçek Zamanlı Socket.io Olayları](#-gerçek-zamanlı-socketio-olayları)
8. [E-posta Bildirimleri (Nodemailer)](#-e-posta-bildirimleri-nodemailer)
9. [Test ve Doğrulama](#-test-ve-doğrulama)

---

## ✨ Öne Çıkan Özellikler

* **🔐 Güvenli Kimlik Doğrulama & Yetkilendirme (JWT & Bcrypt)**:
  - Güçlü parola politikası (en az 8 karakter, büyük harf, küçük harf ve rakam denetimi).
  - Şifrelerin `bcryptjs` (10 round salt) ile hash'lenmesi.
  - Güvenli şifre güncelleme (`/api/v1/auth/update-password`) ve oturum yenileme.
* **👥 Rol Tabanlı Proje & Pano Yönetimi (RBAC)**:
  - `owner` (Proje Sahibi): Tam yetki ve projeyi silme.
  - `admin` (Yönetici): Üye ekleme/çıkarma, rol değiştirme, tüm görevleri yönetme.
  - `member` (Üye): Görev oluşturma, düzenleme, durum değiştirme ve dosya ekleme.
  - `viewer` (İzleyici): Sadece panoyu ve görevleri görüntüleme (salt-okunur).
* **📋 Görev Yönetimi (Task CRUD)**:
  - Görev durumları: `todo` ➡️ `in-progress` ➡️ `done`.
  - Görev öncelikleri: `low`, `medium`, `high`, `urgent`.
  - Etiketleme (`tags`), bitiş tarihi (`dueDate`), atanan üye (`assignee`).
  - Gelişmiş filtreleme ve metin araması (`status`, `priority`, `assignee`, `tag`, `search`).
* **📎 Dosya Yükleme (Multer)**:
  - Görevlere görsel (PNG, JPG), PDF, doküman veya arşiv dosyaları ekleme.
  - 10 MB boyut sınırı, dosya uzantı denetimi ve görev silindiğinde fiziksel dosyaların diskten otomatik temizlenmesi.
* **⚡ Gerçek Zamanlı Bildirimler (Socket.io)**:
  - Proje odaları (`project:<id>`) üzerinden anlık durum güncellemeleri.
  - Canlı web takip arayüzü: `http://localhost:5001/realtime-test`.
* **📧 Otomatik E-posta Bildirimleri (Nodemailer)**:
  - Bir göreve kullanıcı atandığında şık HTML şablonuyla otomatik mail gönderimi.
  - Test için hazır **Ethereal Test SMTP** entegrasyonu ve anında tarayıcı önizleme linki.
* **🛡️ Yönetici (Admin) Kullanıcı Yönetim Modülü**:
  - Sistemdeki tüm kullanıcıları listeleme, hesap dondurma (`isActive: false`), rol değiştirme ve pano istatistikleri.
* **📚 İnteraktif API Dokümantasyonu (Swagger / OpenAPI 3.0)**:
  - Tarayıcı üzerinden doğrudan denenebilir `/api-docs/` arayüzü.

---

## 🛠️ Teknoloji Yığını

| Kategori | Teknoloji | Açıklama |
|---|---|---|
| **Çekirdek** | Node.js & Express | RESTful API sunucusu |
| **Veritabanı** | MongoDB & Mongoose | Esnek belge (document) tabanlı veri modeli ve ODM |
| **Kimlik Doğrulama** | JWT & Bcryptjs | JSON Web Token ve güvenli şifre hash'leme |
| **Gerçek Zamanlı** | Socket.io | WebSocket tabanlı canlı proje odaları ve event yayınları |
| **Dosya Yükleme** | Multer | Yerel disk depolama ve dosya türü filtreleme |
| **E-posta** | Nodemailer (Ethereal) | Görev atamalarında HTML e-posta bildirimi |
| **Dokümantasyon** | Swagger UI & JSDoc | OpenAPI 3.0 interaktif API dokümanı |
| **Güvenlik & Log** | Helmet, Cors, Morgan | HTTP başlık güvenliği, CORS yönetimi ve istek loglama |
| **Validasyon** | Express-Validator | Katmanlı veri doğrulama middleware'i |

---

## 🏗️ Klasör ve Mimari Yapısı

```text
├── src/
│   ├── config/
│   │   ├── db.js             # MongoDB Atlas bağlantı ayarları
│   │   └── swagger.js        # Swagger / OpenAPI 3.0 konfigürasyonu
│   ├── controllers/
│   │   ├── auth.controller.js    # Kayıt, Giriş, Profil, Şifre Değiştirme
│   │   ├── project.controller.js # Proje CRUD, Üye & Rol Yönetimi
│   │   ├── task.controller.js    # Görev CRUD, Durum Güncelleme, Dosya Eki
│   │   └── user.controller.js    # Sistem Yöneticisi (Admin) Kullanıcı Yönetimi
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT doğrulama ve Role-based yetkilendirme
│   │   ├── error.middleware.js   # Merkezi hata yakalama (Centralized Error Handler)
│   │   ├── upload.middleware.js  # Multer dosya filtreleme ve depolama
│   │   └── validate.middleware.js# Express-validator hata yakalayıcı
│   ├── models/
│   │   ├── User.js           # Kullanıcı şeması (şifreleme, unvan, aktiflik)
│   │   ├── Project.js        # Proje şeması (sahip, üyeler, roller, renk)
│   │   └── Task.js           # Görev şeması (durum, öncelik, ekler, atanan)
│   ├── routes/
│   │   ├── auth.routes.js        # /api/v1/auth
│   │   ├── project.routes.js     # /api/v1/projects
│   │   ├── task.routes.js        # /api/v1/tasks
│   │   ├── user.routes.js        # /api/v1/users (Admin)
│   │   └── index.js              # Ana router birleştirici ve /health
│   ├── services/
│   │   ├── socket.service.js     # Socket.io proje odaları ve event yayınları
│   │   └── email.service.js      # Nodemailer görev atama e-posta şablonu
│   ├── utils/
│   │   ├── apiError.js           # Standart hata sınıfı
│   │   ├── apiResponse.js        # Standart başarılı yanıt sarmalayıcı
│   │   └── asyncHandler.js       # Asenkron controller sarmalayıcı
│   ├── views/
│   │   └── realtime-test.html    # Canlı Socket.io görsel test dashboard'u
│   └── app.js                    # Express app ve middleware yapılandırması
├── uploads/                      # Yüklenen görev eklerinin tutulduğu dizin
├── index.js                      # HTTP & Socket.io sunucu başlatıcı
├── test-stage3.js                # Uçtan uca otomatik test paketi
├── .env.example                  # Ortam değişkenleri şablonu
├── .gitignore                    # node_modules, .env, uploads hariç tutma
└── package.json
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone git@github.com:altiparmakmustafa/project-management-api.git
cd project-management-api
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın
`.env.example` dosyasını `.env` olarak kopyalayın ve bilgilerinizi girin:
```bash
cp .env.example .env
```

### 4. Sunucuyu Başlatın

**Geliştirme Modunda (Önerilen - Otomatik Yeniden Başlatma):**
```bash
npm run dev
```

**Normal Modda:**
```bash
npm start
```

Sunucu başladığında şu adresler aktif olacaktır:
* 📚 **Swagger API Dokümanı:** [http://localhost:5001/api-docs/](http://localhost:5001/api-docs/)
* ⚡ **Canlı Socket.io Takip Arayüzü:** [http://localhost:5001/realtime-test](http://localhost:5001/realtime-test)
* 🩺 **Sağlık Kontrolü (Health Check):** [http://localhost:5001/api/v1/health](http://localhost:5001/api/v1/health)

---

## ⚙️ Ortam Değişkenleri (.env)

```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<your-cluster>.mongodb.net/task_manager?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000

# İsteğe Bağlı: Özel SMTP Ayarları (Tanımlanmazsa otomatik Ethereal Test SMTP kullanılır)
# SMTP_HOST=smtp.mailtrap.io
# SMTP_PORT=2525
# SMTP_USER=your_smtp_user
# SMTP_PASS=your_smtp_password
```

---

## 📡 API Uç Noktaları (Endpoints)

### 🔐 1. Kimlik Doğrulama & Profil (`/api/v1/auth`)

| Metot | Uç Nokta | Yetki | Açıklama |
|---|---|:---:|---|
| `POST` | `/api/v1/auth/register` | Herkes | Yeni kullanıcı kaydı oluşturur ve JWT token döner |
| `POST` | `/api/v1/auth/login` | Herkes | Giriş yapar ve JWT token döner |
| `GET` | `/api/v1/auth/me` | JWT | Giriş yapan kullanıcının profil bilgilerini getirir |
| `PUT` | `/api/v1/auth/me` | JWT | İsim, unvan veya avatar günceller |
| `PUT` | `/api/v1/auth/update-password` | JWT | Mevcut şifreyi doğrulayarak yeni şifre belirler |

---

### 📁 2. Proje Yönetimi (`/api/v1/projects`)

| Metot | Uç Nokta | Yetki | Açıklama |
|---|---|:---:|---|
| `POST` | `/api/v1/projects` | JWT | Yeni proje panosu oluşturur (oluşturan ilk admin olur) |
| `GET` | `/api/v1/projects` | JWT | Dahil olunan tüm projeleri listeler (`?status=active`) |
| `GET` | `/api/v1/projects/:id` | Üye | Proje detayını, üyelerini, rollerini ve görevlerini getirir |
| `PUT` | `/api/v1/projects/:id` | Owner/Admin | Proje başlığı, açıklama, renk veya durum günceller |
| `DELETE` | `/api/v1/projects/:id` | Sadece Owner | Projeyi ve bağlı tüm görevleri siler |
| `POST` | `/api/v1/projects/:id/members` | Owner/Admin | Projeye yeni üye ekler (`admin`, `member`, `viewer`) |
| `PUT` | `/api/v1/projects/:id/members/:userId/role` | Owner/Admin | Projedeki üyenin rolünü günceller |
| `DELETE` | `/api/v1/projects/:id/members/:userId` | Owner/Admin/Kendi | Üyeyi projeden çıkarır veya projeden ayrılır |

---

### 📋 3. Görev Yönetimi (`/api/v1/tasks` & `/api/v1/projects/:id/tasks`)

| Metot | Uç Nokta | Yetki | Açıklama |
|---|---|:---:|---|
| `POST` | `/api/v1/projects/:projectId/tasks` | Member/Admin | Projeye yeni görev ekler *(Socket.io & Mail tetikler)* |
| `GET` | `/api/v1/projects/:projectId/tasks` | Üye | Görevleri filtreler (`status`, `priority`, `assignee`, `search`) |
| `GET` | `/api/v1/tasks/:id` | Üye | Tek bir görevin tüm detaylarını ve dosya eklerini getirir |
| `PUT` | `/api/v1/tasks/:id` | Member/Admin | Görevi günceller *(Socket.io & Mail tetikler)* |
| `PATCH` | `/api/v1/tasks/:id/status` | Member/Admin | Durumu hızlıca değiştirir (`todo`, `in-progress`, `done`) |
| `DELETE` | `/api/v1/tasks/:id` | Creator/Admin | Görevi ve sunucudaki fiziksel dosya eklerini siler |
| `POST` | `/api/v1/tasks/:id/attachments` | Member/Admin | Göreve dosya eki (görsel, PDF vb.) yükler |
| `DELETE` | `/api/v1/tasks/:id/attachments/:attachmentId` | Creator/Admin | Görevden dosya ekini ve fiziksel dosyayı siler |

---

### 🛡️ 4. Yönetici Kullanıcı Yönetimi (`/api/v1/users`)

| Metot | Uç Nokta | Yetki | Açıklama |
|---|---|:---:|---|
| `GET` | `/api/v1/users` | Sadece Admin | Sistemdeki kullanıcıları arama ve sayfalama ile listeler |
| `GET` | `/api/v1/users/:id` | Sadece Admin | Kullanıcı detayını ve proje/görev istatistiklerini getirir |
| `PUT` | `/api/v1/users/:id` | Sadece Admin | Kullanıcıyı aktifleştirir/pasife alır veya rolünü değiştirir |
| `DELETE` | `/api/v1/users/:id` | Sadece Admin | Kullanıcıyı sistemden siler |

---

## ⚡ Gerçek Zamanlı Socket.io Olayları

İstemciler `socket.emit('join:project', projectId)` göndererek ilgili proje odasına katılır.

| Event Adı | Tetiklenme Durumu | Payload İçeriği |
|---|---|---|
| `task:created` | Projeye yeni görev eklendiğinde | `{ task, createdBy, projectId }` |
| `task:status_changed` | Görevin durumu değiştiğinde (`todo` ➔ `in-progress` ➔ `done`) | `{ taskId, taskTitle, oldStatus, newStatus, updatedBy }` |
| `task:updated` | Görev detayları güncellendiğinde | `{ task, updatedBy, projectId }` |
| `task:deleted` | Görev silindiğinde | `{ taskId, deletedBy, projectId }` |
| `attachment:added` | Göreve dosya eki yüklendiğinde | `{ taskId, attachment, uploadedBy }` |
| `member:added` | Projeye yeni üye eklendiğinde | `{ member, addedBy, projectId }` |

---

## 📧 E-posta Bildirimleri (Nodemailer)

* Bir görev oluşturulurken veya güncellenirken bir üyeye atandığında (`assignee`), Nodemailer otomatik olarak devreye girer.
* Geliştirme ortamında test mailleri **Ethereal Email** servisine iletilir ve terminal konsoluna anında tıklanabilir önizleme URL'i yazdırılır:
  ```text
  [Nodemailer] ✉️ Görev atama e-postası gönderildi: user@example.com
  [Nodemailer] 🔗 Ethereal E-posta Önizleme URL'i: https://ethereal.email/message/...
  ```

---

## 🧪 Test ve Doğrulama

### Otomatik Uçtan Uca Test Paketini Çalıştırma
Proje kök dizininde hazır bulunan test scriptini çalıştırarak Auth, Proje, Socket.io ve Nodemailer entegrasyonlarını saniyeler içinde canlı olarak test edebilirsiniz:

```bash
node test-stage3.js
```

### Canlı Arayüz Testi
Tarayıcınızdan **[http://localhost:5001/realtime-test](http://localhost:5001/realtime-test)** adresini açarak JWT Token ve Proje ID ile canlı bildirim akışını görsel olarak deneyimleyebilirsiniz.

---

## 👤 Geliştirici

**Mustafa Altıparmak**
* GitHub: [@altiparmakmustafa](https://github.com/altiparmakmustafa)
* Proje Deposu: [project-management-api](https://github.com/altiparmakmustafa/project-management-api)
