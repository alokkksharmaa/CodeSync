import { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  createFile,
  createFolder,
  deleteFile,
  renameFile,
} from "../services/fileApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANG_ICON = {
  js: "JS",
  jsx: "JS",
  ts: "TS",
  tsx: "TS",
  py: "PY",
  java: "♨",
  cpp: "C++",
  txt: "TXT",
  c: "C",
  go: "GO",
  rs: "🦀",
  html: "<>",
  css: "#",
  json: "{}",
  md: "📝",
};

const getIcon = (name, type) => {
  if (type === "folder") return null; // handled with CSS
  const ext = name?.split(".").pop()?.toLowerCase() || "";
  return LANG_ICON[ext] || "📄";
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
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  sorted.forEach((f) => {
    map[f._id] = { ...f, children: [] };
  });

  sorted.forEach((f) => {
    // Determine parent folder by matching path+name
    const parentPath = f.path;
    const parent = sorted.find(
      (p) =>
        p.type === "folder" &&
        ((p.path === "/" && parentPath === `/${p.name}`) ||
          (p.path !== "/" && parentPath === `${p.path}/${p.name}`)),
    );
    if (parent && map[parent._id]) {
      map[parent._id].children.push(map[f._id]);
    } else if (f.path === "/") {
      roots.push(map[f._id]);
    }
  });

  return roots;
};

// ─── Inline Input ─────────────────────────────────────────────────────────────

const InlineInput = ({ onSubmit, onCancel, placeholder }) => {
  const [value, setValue] = useState("");
  const submitting = useRef(false);
  const hasSubmitted = useRef(false);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (submitting.current || hasSubmitted.current) return; // prevent double-fire
      const name = value.trim();
      if (!name) {
        onCancel();
        return;
      }
      submitting.current = true;
      hasSubmitted.current = true;
      await onSubmit(name);
      submitting.current = false;
    },
    [value, onSubmit, onCancel],
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") onCancel();
  };

  const handleBlur = () => {
    // Only cancel if we haven't submitted yet
    if (!submitting.current && !hasSubmitted.current) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="explorer-inline-form w-full pr-2">
      <input
        autoFocus
        type="text"
        className="explorer-inline-input w-full bg-gray-900/60 border border-blue-500/50 text-white rounded text-sm px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500/50"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </form>
  );
};

// ─── Tree Node ────────────────────────────────────────────────────────────────

const TreeNode = ({
  node,
  level,
  activeFileId,
  onFileSelect,
  onFilesChange,
  allFiles,
  canEdit,
  workspaceId,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [creating, setCreating] = useState(null); // 'file'|'folder'|null
  const [renaming, setRenaming] = useState(false);

  const folderPath =
    node.path === "/" ? `/${node.name}` : `${node.path}/${node.name}`;

  const handleCreateFile = async (name) => {
    try {
      const newFile = await createFile({ workspaceId, name, path: folderPath });
      // Don't add to state here - let socket handle it to avoid duplicates
      // onFilesChange((prev) => [...prev, newFile]);
      onFileSelect(newFile._id);
      toast.success(`Created ${name}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create file";
      toast.error(msg);
    } finally {
      setCreating(null);
    }
  };

  const handleCreateFolder = async (name) => {
    try {
      const newFolder = await createFolder({
        workspaceId,
        name,
        path: folderPath,
      });
      // Don't add to state here - let socket handle it to avoid duplicates
      // onFilesChange((prev) => [...prev, newFolder]);
      toast.success(`Created folder ${name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create folder");
    } finally {
      setCreating(null);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const label =
      node.type === "folder"
        ? `folder "${node.name}" and all its contents`
        : `file "${node.name}"`;
    if (!window.confirm(`Delete ${label}?`)) return;
    try {
      const result = await deleteFile(node._id);
      onFilesChange((prev) =>
        prev.filter((f) => !result.deletedIds.includes(String(f._id))),
      );
      if (result.deletedIds.includes(String(activeFileId))) onFileSelect(null);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleRename = async (name) => {
    try {
      const updated = await renameFile(node._id, name);
      onFilesChange((prev) => {
        // If folder renamed, update all child paths too
        return prev.map((f) => {
          if (String(f._id) === String(updated._id))
            return { ...f, ...updated };
          return f;
        });
      });
      toast.success(`Renamed to ${name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename");
    } finally {
      setRenaming(false);
    }
  };

  if (node.type === "folder") {
    return (
      <div className="tree-folder" style={{ paddingLeft: `${level * 12}px` }}>
        <div
          className="explorer-item explorer-folder group flex items-center justify-between py-1.5 px-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-md cursor-pointer transition select-none mx-1"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="folder-arrow text-gray-500 w-4 text-center">{expanded ? "▾" : "▸"}</span>
            <span className="folder-icon text-blue-400 opacity-80">📁</span>
            {renaming ? (
              <InlineInput
                placeholder={node.name}
                onSubmit={handleRename}
                onCancel={() => setRenaming(false)}
              />
            ) : (
              <span className="file-name truncate">{node.name}</span>
            )}
          </div>
          {canEdit && !renaming && (
            <div className="item-actions hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn-icon-tiny text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-white/10 transition"
                title="New file"
                onClick={() => setCreating("file")}
              >
                +F
              </button>
              <button
                className="btn-icon-tiny text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-white/10 transition"
                title="New folder"
                onClick={() => setCreating("folder")}
              >
                +D
              </button>
              <button
                className="btn-icon-tiny text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-white/10 transition"
                title="Rename"
                onClick={() => setRenaming(true)}
              >
                ✎
              </button>
              <button
                className="btn-icon-tiny btn-delete-tiny text-gray-400 hover:text-red-400 px-1 py-0.5 rounded hover:bg-red-500/10 transition"
                title="Delete"
                onClick={handleDelete}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div className="tree-children">
            {creating === "file" && (
              <div style={{ paddingLeft: `${(level + 1) * 12}px` }}>
                <InlineInput
                  placeholder="filename.js"
                  onSubmit={handleCreateFile}
                  onCancel={() => setCreating(null)}
                />
              </div>
            )}
            {creating === "folder" && (
              <div style={{ paddingLeft: `${(level + 1) * 12}px` }}>
                <InlineInput
                  placeholder="folder-name"
                  onSubmit={handleCreateFolder}
                  onCancel={() => setCreating(null)}
                />
              </div>
            )}
            {node.children.map((child) => (
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
      className={`explorer-item group flex items-center justify-between py-1.5 px-2 text-sm rounded-md cursor-pointer transition select-none mx-1 ${activeFileId === node._id ? "bg-blue-500/15 text-blue-400" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
      style={{ paddingLeft: `${level * 12 + 20}px` }}
      onClick={() => onFileSelect(node._id)}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="file-icon opacity-80 w-4 text-center">{getIcon(node.name, node.type)}</span>
        {renaming ? (
          <InlineInput
            placeholder={node.name}
            onSubmit={handleRename}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className="file-name truncate">{node.name}</span>
        )}
      </div>
      {canEdit && !renaming && (
        <div className="item-actions hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-icon-tiny text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-white/10 transition"
            title="Rename"
            onClick={(e) => {
              e.stopPropagation();
              setRenaming(true);
            }}
          >
            ✎
          </button>
          <button
            className="btn-icon-tiny btn-delete-tiny text-gray-400 hover:text-red-400 px-1 py-0.5 rounded hover:bg-red-500/10 transition"
            title="Delete"
            onClick={handleDelete}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

// ─── FileExplorer ─────────────────────────────────────────────────────────────

const FileExplorer = ({
  workspaceId,
  files,
  activeFileId,
  onFileSelect,
  onFilesChange,
  canEdit,
}) => {
  const [creatingRoot, setCreatingRoot] = useState(null); // 'file'|'folder'|null
  const submittingRoot = useRef(false);

  const tree = buildTree(files);

  const handleRootCreate = async (type, name) => {
    if (submittingRoot.current) return;
    // Local duplicate check before hitting server
    const dup = files.find(
      (f) => f.path === "/" && f.name.toLowerCase() === name.toLowerCase(),
    );
    if (dup) {
      toast.error(`A ${dup.type} named "${name}" already exists here.`);
      return;
    }
    submittingRoot.current = true;
    try {
      if (type === "file") {
        const newFile = await createFile({ workspaceId, name, path: "/" });
        // Don't add to state here - let socket handle it to avoid duplicates
        // onFilesChange((prev) => [...prev, newFile]);
        onFileSelect(newFile._id);
        toast.success(`Created ${name}`);
      } else {
        const newFolder = await createFolder({ workspaceId, name, path: "/" });
        // Don't add to state here - let socket handle it to avoid duplicates
        // onFilesChange((prev) => [...prev, newFolder]);
        toast.success(`Created folder ${name}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create";
      toast.error(msg);
    } finally {
      submittingRoot.current = false;
      setCreatingRoot(null);
    }
  };

  return (
    <div className="file-explorer w-64 bg-gray-900/60 backdrop-blur-md border-r border-gray-800/60 flex flex-col shrink-0 text-gray-300">
      <div className="explorer-header flex items-center justify-between px-4 py-3 border-b border-gray-800/60 mb-2">
        <span className="explorer-title text-xs font-semibold tracking-wider text-gray-500 uppercase">FILES</span>
        {canEdit && (
          <div className="explorer-header-actions flex items-center gap-1">
            <button
              className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
              title="New File"
              onClick={() => setCreatingRoot("file")}
            >
              +F
            </button>
            <button
              className="btn-icon w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition"
              title="New Folder"
              onClick={() => setCreatingRoot("folder")}
            >
              +D
            </button>
          </div>
        )}
      </div>

      <div className="explorer-list flex-1 overflow-y-auto pb-4 custom-scrollbar">
        {creatingRoot === "file" && (
          <div className="px-3 mb-1">
            <InlineInput
              placeholder="filename.js"
              onSubmit={(name) => handleRootCreate("file", name)}
              onCancel={() => setCreatingRoot(null)}
            />
          </div>
        )}
        {creatingRoot === "folder" && (
          <div className="px-3 mb-1">
            <InlineInput
              placeholder="folder-name"
              onSubmit={(name) => handleRootCreate("folder", name)}
              onCancel={() => setCreatingRoot(null)}
            />
          </div>
        )}

        {files.length === 0 && !creatingRoot && (
          <p className="explorer-empty text-sm text-gray-500 text-center p-6 italic">
            No files yet. Create one to start coding.
          </p>
        )}

        {tree.map((node) => (
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
