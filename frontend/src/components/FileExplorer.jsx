import { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Folder,
  ChevronDown,
  ChevronRight,
  FilePlus,
  FolderPlus,
  Pencil,
  X,
  Search,
} from "lucide-react";
import {
  createFile,
  createFolder,
  deleteFile,
  renameFile,
} from "../services/fileApi";

const LANG_ICON = {
  js: "JS",
  jsx: "JS",
  ts: "TS",
  tsx: "TS",
  py: "PY",
  java: "JV",
  cpp: "C++",
  txt: "TXT",
  c: "C",
  go: "GO",
  rs: "RS",
  html: "<>",
  css: "#",
  json: "{}",
  md: "MD",
};

const getIcon = (name, type) => {
  if (type === "folder") return null;
  const ext = name?.split(".").pop()?.toLowerCase() || "";
  return LANG_ICON[ext] || "FILE";
};

const buildTree = (files) => {
  const map = {};
  const roots = [];

  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  sorted.forEach((f) => {
    map[f._id] = { ...f, children: [] };
  });

  sorted.forEach((f) => {
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

const filterTree = (nodes, query) => {
  if (!query.trim()) return nodes;

  return nodes
    .map((node) => {
      const matches = node.name.toLowerCase().includes(query.toLowerCase());

      if (node.type === "folder") {
        const filteredChildren = filterTree(node.children || [], query);
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }

      if (matches) return node;
      return null;
    })
    .filter(Boolean);
};

const highlightMatch = (text, query) => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span
        key={index}
        className="bg-accent/20 text-accent-hover rounded px-0.5"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
};

const InlineInput = ({ onSubmit, onCancel, placeholder }) => {
  const [value, setValue] = useState("");
  const submitting = useRef(false);
  const hasSubmitted = useRef(false);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (submitting.current || hasSubmitted.current) return;
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
    if (!submitting.current && !hasSubmitted.current) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="explorer-inline-form">
      <input
        autoFocus
        type="text"
        className="explorer-inline-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    </form>
  );
};

const TreeNode = ({
  node,
  level,
  activeFileId,
  onFileSelect,
  onFilesChange,
  allFiles,
  canEdit,
  workspaceId,
  searchQuery,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [creating, setCreating] = useState(null);
  const [renaming, setRenaming] = useState(false);

  const folderPath =
    node.path === "/" ? `/${node.name}` : `${node.path}/${node.name}`;

  const handleCreateFile = async (name) => {
    try {
      const newFile = await createFile({ workspaceId, name, path: folderPath });
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
      await createFolder({ workspaceId, name, path: folderPath });
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
      if (result.deletedIds.includes(String(activeFileId))) {
        onFileSelect(null);
      }
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleRename = async (name) => {
    try {
      const updated = await renameFile(node._id, name);
      onFilesChange((prev) =>
        prev.map((f) =>
          String(f._id) === String(updated._id) ? { ...f, ...updated } : f,
        ),
      );
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
          className="explorer-item explorer-folder group"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="folder-arrow">
              {expanded ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </span>
            <span className="folder-icon">
              <Folder size={14} fill="currentColor" fillOpacity={0.15} />
            </span>
            {renaming ? (
              <InlineInput
                placeholder={node.name}
                onSubmit={handleRename}
                onCancel={() => setRenaming(false)}
              />
            ) : (
              <span className="file-name">
                {highlightMatch(node.name, searchQuery)}
              </span>
            )}
          </div>

          {canEdit && !renaming && (
            <div className="item-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn-icon-tiny"
                title="New file"
                onClick={() => setCreating("file")}
              >
                <FilePlus size={13} />
              </button>
              <button
                className="btn-icon-tiny"
                title="New folder"
                onClick={() => setCreating("folder")}
              >
                <FolderPlus size={13} />
              </button>
              <button
                className="btn-icon-tiny"
                title="Rename"
                onClick={() => setRenaming(true)}
              >
                <Pencil size={12} />
              </button>
              <button
                className="btn-icon-tiny btn-delete-tiny"
                title="Delete"
                onClick={handleDelete}
              >
                <X size={13} />
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
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`explorer-item group ${activeFileId === node._id ? "active" : ""}`}
      style={{ paddingLeft: `${level * 12 + 20}px` }}
      onClick={() => onFileSelect(node._id)}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="file-icon">{getIcon(node.name, node.type)}</span>
        {renaming ? (
          <InlineInput
            placeholder={node.name}
            onSubmit={handleRename}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className="file-name">
            {highlightMatch(node.name, searchQuery)}
          </span>
        )}
      </div>

      {canEdit && !renaming && (
        <div className="item-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-icon-tiny"
            title="Rename"
            onClick={(e) => {
              e.stopPropagation();
              setRenaming(true);
            }}
          >
            <Pencil size={12} />
          </button>
          <button
            className="btn-icon-tiny btn-delete-tiny"
            title="Delete"
            onClick={handleDelete}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({
  workspaceId,
  files,
  activeFileId,
  onFileSelect,
  onFilesChange,
  canEdit,
}) => {
  const [creatingRoot, setCreatingRoot] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const submittingRoot = useRef(false);

  const tree = buildTree(files);
  const filteredTree = filterTree(tree, searchQuery);

  const handleRootCreate = async (type, name) => {
    if (submittingRoot.current) return;
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
        onFileSelect(newFile._id);
        toast.success(`Created ${name}`);
      } else {
        await createFolder({ workspaceId, name, path: "/" });
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
    <div className="file-explorer">
      <div className="explorer-header">
        <span className="explorer-title">Files</span>
        {canEdit && (
          <div className="explorer-header-actions">
            <button
              className="btn-icon-tiny"
              title="New File"
              onClick={() => setCreatingRoot("file")}
            >
              <FilePlus size={14} />
            </button>
            <button
              className="btn-icon-tiny"
              title="New Folder"
              onClick={() => setCreatingRoot("folder")}
            >
              <FolderPlus size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="explorer-search">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="explorer-search-input pl-9"
          />
        </div>
      </div>

      <div className="explorer-list">
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
          <p className="explorer-empty">
            No files yet. Create one to start coding.
          </p>
        )}

        {filteredTree.length === 0 &&
          searchQuery.trim() &&
          files.length > 0 && <p className="explorer-empty">No files found</p>}

        {filteredTree.map((node) => (
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
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
