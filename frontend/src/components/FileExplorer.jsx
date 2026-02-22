import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { createFile, createFolder, deleteFile, renameFile } from '../services/fileApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANG_ICON = {
  js: 'JS', jsx: 'JS',
  ts: 'TS', tsx: 'TS',
  py: 'PY', java: '♨',
  txt: 'TXT', md: '📝',
  cpp: 'C++', c: 'C',
  go: 'GO', rs: '🦀',
  html: '<>', css: '#',
  json: '{}', md: '📝',
};

const getIcon = (name, type) => {
  if (type === 'folder') return null; // handled with CSS
  const ext = name?.split('.').pop()?.toLowerCase() || '';
  return LANG_ICON[ext] || '📄';
};

/**
 * Build a tree from a flat list of files.
 * Returns an array of nodes: { ...file, children: [] }
 */
const buildTree = (files) => {
  const map = {};
  const roots = [];

  // Sort: folders first, then alphabetically
  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  sorted.forEach(f => { map[f._id] = { ...f, children: [] }; });

  sorted.forEach(f => {
    // Determine parent folder by matching path+name
    const parentPath = f.path;
    const parent = sorted.find(
      p => p.type === 'folder' && (
        (p.path === '/' && parentPath === `/${p.name}`) ||
        (p.path !== '/' && parentPath === `${p.path}/${p.name}`)
      )
    );
    if (parent && map[parent._id]) {
      map[parent._id].children.push(map[f._id]);
    } else if (f.path === '/') {
      roots.push(map[f._id]);
    }
  });

  return roots;
};

// ─── Inline Input ─────────────────────────────────────────────────────────────

const InlineInput = ({ onSubmit, onCancel, placeholder }) => {
  const [value, setValue] = useState('');
  const submitting = useRef(false);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (submitting.current) return; // debounce: prevent double-fire
    const name = value.trim();
    if (!name) { onCancel(); return; }
    submitting.current = true;
    await onSubmit(name);
    submitting.current = false;
  }, [value, onSubmit, onCancel]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="explorer-inline-form">
      <input
        autoFocus
        type="text"
        className="explorer-inline-input"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={() => { if (!submitting.current) onCancel(); }}
        onKeyDown={handleKeyDown}
      />
    </form>
  );
};

// ─── Tree Node ────────────────────────────────────────────────────────────────

const TreeNode = ({ node, level, activeFileId, onFileSelect, onFilesChange, allFiles, canEdit, workspaceId }) => {
  const [expanded, setExpanded] = useState(true);
  const [creating, setCreating] = useState(null); // 'file'|'folder'|null
  const [renaming, setRenaming]= useState(false);

  const folderPath = node.path === '/'
    ? `/${node.name}`
    : `${node.path}/${node.name}`;

  const handleCreateFile = async (name) => {
    try {
      const newFile = await createFile({ workspaceId, name, path: folderPath });
      onFilesChange(prev => [...prev, newFile]);
      onFileSelect(newFile._id);
      toast.success(`Created ${name}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create file';
      toast.error(msg);
    } finally {
      setCreating(null);
    }
  };

  const handleCreateFolder = async (name) => {
    try {
      const newFolder = await createFolder({ workspaceId, name, path: folderPath });
      onFilesChange(prev => [...prev, newFolder]);
      toast.success(`Created folder ${name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create folder');
    } finally {
      setCreating(null);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const label = node.type === 'folder' ? `folder "${node.name}" and all its contents` : `file "${node.name}"`;
    if (!window.confirm(`Delete ${label}?`)) return;
    try {
      const result = await deleteFile(node._id);
      onFilesChange(prev => prev.filter(f => !result.deletedIds.includes(String(f._id))));
      if (result.deletedIds.includes(String(activeFileId))) onFileSelect(null);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRename = async (name) => {
    try {
      const updated = await renameFile(node._id, name);
      onFilesChange(prev => {
        // If folder renamed, update all child paths too
        return prev.map(f => {
          if (String(f._id) === String(updated._id)) return { ...f, ...updated };
          return f;
        });
      });
      toast.success(`Renamed to ${name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename');
    } finally {
      setRenaming(false);
    }
  };

  if (node.type === 'folder') {
    return (
      <div className="tree-folder" style={{ paddingLeft: `${level * 12}px` }}>
        <div className="explorer-item explorer-folder" onClick={() => setExpanded(v => !v)}>
          <span className="folder-arrow">{expanded ? '▾' : '▸'}</span>
          <span className="folder-icon">📁</span>
          {renaming ? (
            <InlineInput
              placeholder={node.name}
              onSubmit={handleRename}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <span className="file-name">{node.name}</span>
          )}
          {canEdit && !renaming && (
            <div className="item-actions" onClick={e => e.stopPropagation()}>
              <button className="btn-icon-tiny" title="New file" onClick={() => setCreating('file')}>+F</button>
              <button className="btn-icon-tiny" title="New folder" onClick={() => setCreating('folder')}>+D</button>
              <button className="btn-icon-tiny" title="Rename" onClick={() => setRenaming(true)}>✎</button>
              <button className="btn-icon-tiny btn-delete-tiny" title="Delete" onClick={handleDelete}>✕</button>
            </div>
          )}
        </div>

        {expanded && (
          <div className="tree-children">
            {creating === 'file' && (
              <div style={{ paddingLeft: `${(level + 1) * 12}px` }}>
                <InlineInput placeholder="filename.js" onSubmit={handleCreateFile} onCancel={() => setCreating(null)} />
              </div>
            )}
            {creating === 'folder' && (
              <div style={{ paddingLeft: `${(level + 1) * 12}px` }}>
                <InlineInput placeholder="folder-name" onSubmit={handleCreateFolder} onCancel={() => setCreating(null)} />
              </div>
            )}
            {node.children.map(child => (
              <TreeNode
                key={child._id}
                node={child}
                level={level + 1}
                activeFileId={activeFileId}
                onFileSelect={onFileSelect}
                onFilesChange={onFilesChange}
                allFiles={allFiles}
                canEdit={canEdit}
                workspaceId={workspaceId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  return (
    <div
      className={`explorer-item ${activeFileId === node._id ? 'active' : ''}`}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
      onClick={() => onFileSelect(node._id)}
    >
      <span className="file-icon">{getIcon(node.name, node.type)}</span>
      {renaming ? (
        <InlineInput
          placeholder={node.name}
          onSubmit={handleRename}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <span className="file-name">{node.name}</span>
      )}
      {canEdit && !renaming && (
        <div className="item-actions" onClick={e => e.stopPropagation()}>
          <button className="btn-icon-tiny" title="Rename" onClick={e => { e.stopPropagation(); setRenaming(true); }}>✎</button>
          <button className="btn-icon-tiny btn-delete-tiny" title="Delete" onClick={handleDelete}>✕</button>
        </div>
      )}
    </div>
  );
};

// ─── FileExplorer ─────────────────────────────────────────────────────────────

const FileExplorer = ({ workspaceId, files, activeFileId, onFileSelect, onFilesChange, canEdit }) => {
  const [creatingRoot, setCreatingRoot] = useState(null); // 'file'|'folder'|null
  const submittingRoot = useRef(false);

  const tree = buildTree(files);

  const handleRootCreate = async (type, name) => {
    if (submittingRoot.current) return;
    // Local duplicate check before hitting server
    const dup = files.find(
      f => f.path === '/' && f.name.toLowerCase() === name.toLowerCase()
    );
    if (dup) {
      toast.error(`A ${dup.type} named "${name}" already exists here.`);
      return;
    }
    submittingRoot.current = true;
    try {
      if (type === 'file') {
        const newFile = await createFile({ workspaceId, name, path: '/' });
        onFilesChange(prev => [...prev, newFile]);
        onFileSelect(newFile._id);
        toast.success(`Created ${name}`);
      } else {
        const newFolder = await createFolder({ workspaceId, name, path: '/' });
        onFilesChange(prev => [...prev, newFolder]);
        toast.success(`Created folder ${name}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create';
      toast.error(msg);
    } finally {
      submittingRoot.current = false;
      setCreatingRoot(null);
    }
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <span className="explorer-title">FILES</span>
        {canEdit && (
          <div className="explorer-header-actions">
            <button className="btn-icon" title="New File" onClick={() => setCreatingRoot('file')}>+F</button>
            <button className="btn-icon" title="New Folder" onClick={() => setCreatingRoot('folder')}>+D</button>
          </div>
        )}
      </div>

      <div className="explorer-list">
        {creatingRoot === 'file' && (
          <InlineInput
            placeholder="filename.js"
            onSubmit={name => handleRootCreate('file', name)}
            onCancel={() => setCreatingRoot(null)}
          />
        )}
        {creatingRoot === 'folder' && (
          <InlineInput
            placeholder="folder-name"
            onSubmit={name => handleRootCreate('folder', name)}
            onCancel={() => setCreatingRoot(null)}
          />
        )}

        {files.length === 0 && !creatingRoot && (
          <p className="explorer-empty">No files yet. Create one to start coding.</p>
        )}

        {tree.map(node => (
          <TreeNode
            key={node._id}
            node={node}
            level={0}
            activeFileId={activeFileId}
            onFileSelect={onFileSelect}
            onFilesChange={onFilesChange}
            allFiles={files}
            canEdit={canEdit}
            workspaceId={workspaceId}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
