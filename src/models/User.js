const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lütfen isim ve soyisim giriniz'],
      trim: true,
      maxlength: [50, 'İsim en fazla 50 karakter olabilir'],
    },
    email: {
      type: String,
      required: [true, 'Lütfen geçerli bir e-posta adresi giriniz'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Lütfen geçerli bir e-posta adresi giriniz',
      ],
    },
    password: {
      type: String,
      required: [true, 'Lütfen bir şifre belirleyiniz'],
      minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Şifreyi kaydetmeden önce hash'leme
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
