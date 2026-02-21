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
    path: {
      type: String,
      default: '/',
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'javascript',
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique file path per workspace
fileSchema.index({ workspaceId: 1, path: 1, name: 1 }, { unique: true });

const File = mongoose.model('File', fileSchema);
export default File;
