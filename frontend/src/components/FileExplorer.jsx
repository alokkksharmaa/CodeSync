import { useState } from 'react';
import toast from 'react-hot-toast';
import { createFile, deleteFile, renameFile } from '../services/fileApi';

const FileExplorer = ({ workspaceId, files, activeFileId, onFileSelect, onFilesChange, canEdit }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      const newFile = await createFile({
        workspaceId,
        name: newFileName.trim(),
        language: getLanguageFromExt(newFileName),
      });
      onFilesChange([...files, newFile]);
      setNewFileName('');
      setIsCreating(false);
      onFileSelect(newFile._id);
      toast.success('File created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create file');
    }
  };

  const handleDelete = async (e, fileId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await deleteFile(fileId);
      onFilesChange(files.filter(f => f._id !== fileId));
      if (activeFileId === fileId) onFileSelect(null);
      toast.success('File deleted');
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  const getLanguageFromExt = (name) => {
    const ext = name.split('.').pop();
    const map = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      html: 'html',
      css: 'css',
      json: 'json'
    };
    return map[ext] || 'javascript';
  };

  const getIcon = (name) => {
    const ext = name.split('.').pop();
    switch (ext) {
      case 'js': return 'JS';
      case 'ts': return 'TS';
      case 'py': return 'PY';
      case 'css': return '#';
      case 'html': return '<>';
      case 'json': return '{ }';
      default: return '📄';
    }
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <span className="explorer-title">Files</span>
        {canEdit && (
          <button className="btn-icon" onClick={() => setIsCreating(true)} title="New File">
            +
          </button>
        )}
      </div>

      <div className="explorer-list">
        {isCreating && (
          <form onSubmit={handleCreate} className="explorer-create-form">
            <input
              type="text"
              autoFocus
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => !newFileName && setIsCreating(false)}
            />
          </form>
        )}

        {files.map((file) => (
          <div
            key={file._id}
            className={`explorer-item ${activeFileId === file._id ? 'active' : ''}`}
            onClick={() => onFileSelect(file._id)}
          >
            <span className="file-icon">{getIcon(file.name)}</span>
            <span className="file-name">{file.name}</span>
            {canEdit && files.length > 1 && (
              <button
                className="btn-delete-tiny"
                onClick={(e) => handleDelete(e, file._id)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
