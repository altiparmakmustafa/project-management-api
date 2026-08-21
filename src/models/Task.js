const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lütfen bir görev başlığı giriniz'],
      trim: true,
      maxlength: [150, 'Görev başlığı en fazla 150 karakter olabilir'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Açıklama en fazla 2000 karakter olabilir'],
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in-progress', 'done'],
        message: 'Durum todo, in-progress veya done olmalıdır',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Öncelik low, medium, high veya urgent olmalıdır',
      },
      default: 'medium',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Görevin bağlı olduğu proje zorunludur'],
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    dueDate: {
      type: Date,
      default: null,
    },
    attachments: [attachmentSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Performans için indekslemeler
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
