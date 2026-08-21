const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lütfen bir proje başlığı giriniz'],
      trim: true,
      maxlength: [100, 'Proje başlığı en fazla 100 karakter olabilir'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Açıklama en fazla 500 karakter olabilir'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Proje sahibi zorunludur'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    color: {
      type: String,
      default: '#3b82f6', // Varsayılan mavi renk kodu
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Projeye ait görevlerin sanal (virtual) ilişkisi
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
