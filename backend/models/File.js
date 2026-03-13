import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Normalized stored name for case-insensitive uniqueness
    nameLower: {
      type: String,
    },
    // Directory path this file/folder belongs to (e.g. "/" or "/src" or "/src/components")
    path: {
      type: String,
      default: '/',
    },
    // 'file' or 'folder'
    type: {
      type: String,
      enum: ['file', 'folder'],
      default: 'file',
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'javascript',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook: normalize nameLower for case-insensitive uniqueness
fileSchema.pre('save', function (next) {
  this.nameLower = this.name.toLowerCase();
  next();
});

// Compound unique index: one name per path per workspace (case-insensitive via nameLower)
fileSchema.index({ workspaceId: 1, path: 1, nameLower: 1 }, { unique: true });
// Index for listening to all files in a workspace
fileSchema.index({ workspaceId: 1, path: 1 });

const File = mongoose.model('File', fileSchema);
export default File;
