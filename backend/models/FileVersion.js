import mongoose from 'mongoose';

const fileVersionSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const FileVersion = mongoose.model('FileVersion', fileVersionSchema);
export default FileVersion;
