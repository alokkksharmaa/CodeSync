import { useState } from 'react';
import toast from 'react-hot-toast';
import { createFile, deleteFile, renameFile } from '../services/fileApi';

const FileExplorer = ({ workspaceId, files, activeFileId, onFileSelect, onFilesChange, canEdit }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedName = newFileName.trim();
    if (!trimmedName) {
      setIsCreating(false);
      return;
    }

    // Check for duplicates locally first for instant feedback
    if (files.find(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('A file with this name already exists.');
      return;
    }

    try {
      const newFile = await createFile({
        workspaceId,
        name: trimmedName,
        language: getLanguageFromExt(trimmedName),
      });
      onFilesChange([...files, newFile]);
      setNewFileName('');
      setIsCreating(false);
      onFileSelect(newFile._id);
      toast.success(`Created ${trimmedName}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create file';
      toast.error(msg);
      // Keep state open if it's a name error so user can fix it easily
      if (msg.includes('exists')) {
        // focus is already there
      } else {
        setIsCreating(false);
      }
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
    const ext = name?.split('.').pop().toLowerCase() || '';
    const map = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'cpp',
      go: 'go',
      rust: 'rust',
      rs: 'rust',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown'
    };
    return map[ext] || 'javascript';
  };

  const getIcon = (name) => {
    const ext = name?.split('.').pop().toLowerCase() || '';
    switch (ext) {
      case 'js':
      case 'jsx': return 'JS';
      case 'ts':
      case 'tsx': return 'TS';
      case 'py': return 'PY';
      case 'java': return '♨️';
      case 'cpp':
      case 'c': return 'C++';
      case 'go': return 'GO';
      case 'rs':
      case 'rust': return '🦀';
      case 'css': return '#';
      case 'html': return '<>';
      case 'json': return '{ }';
      case 'md': return '📝';
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
            <span className="file-name">{file.name || 'main.js'}</span>
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
