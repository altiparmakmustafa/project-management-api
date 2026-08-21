const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/apiError');

// Uploads dizininin varlığını kontrol et ve oluştur
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk depolama ayarı
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// Dosya türü filtresi
const fileFilter = (req, file, cb) => {
  // İzin verilen dosya uzantıları
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|txt|csv|zip|rar/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedExtensions.test(file.mimetype.toLowerCase()) || true;

  if (extname) {
    return cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Desteklenmeyen dosya türü. İzin verilenler: Görseller (jpg, png vb.), PDF, Word, Excel, Metin, Zip'
      )
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB dosya boyutu sınırı
  },
  fileFilter,
});

module.exports = upload;
