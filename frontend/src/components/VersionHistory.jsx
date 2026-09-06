import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Camera, History, RotateCcw } from "lucide-react";
import { fetchHistory, restoreVersion, saveVersion } from "../services/fileApi";

const VersionHistory = ({ fileId, onRestore, canEdit }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fileId) loadHistory();
  }, [fileId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(fileId);
      setHistory(data);
    } catch (err) {
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleSnapshot = async () => {
    try {
      await saveVersion(fileId);
      toast.success("Snapshot saved");
      loadHistory();
    } catch (err) {
      toast.error("Failed to save snapshot");
    }
  };

  const handleRestore = async (versionId) => {
    if (
      !window.confirm(
        "Restore this version? Current changes will be overwritten.",
      )
    )
      return;
    try {
      const data = await restoreVersion(fileId, versionId);
      onRestore(data.file.content);
      toast.success("Version restored");
    } catch (err) {
      toast.error("Failed to restore version");
    }
  };

  return (
    <div className="version-history">
      <div className="history-header">
        <span className="history-title">
          <History size={14} /> History
        </span>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={handleSnapshot}>
            <Camera size={13} /> Snapshot
          </button>
        )}
      </div>

      <div className="history-list custom-scrollbar">
        {loading ? (
          <div className="history-empty">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="history-empty">No versions found.</div>
        ) : (
          <div className="flex flex-col gap-2 p-2">
            {history.map((v) => (
              <div
                key={v._id}
                className="history-item group border border-border-subtle rounded-lg bg-surface-raised/30 hover:bg-surface-raised/60"
              >
                <div className="history-item-info">
                  <span className="history-date">
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                  <span className="history-user">
                    by <span>{v.editedBy?.username}</span>
                  </span>
                </div>
                {canEdit && (
                  <button
                    className="btn btn-primary btn-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    onClick={() => handleRestore(v._id)}
                  >
                    <RotateCcw size={12} /> Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
