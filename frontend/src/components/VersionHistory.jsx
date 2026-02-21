import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchHistory, restoreVersion, saveVersion } from '../services/fileApi';

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
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleSnapshot = async () => {
    try {
      await saveVersion(fileId);
      toast.success('Snapshot saved');
      loadHistory();
    } catch (err) {
      toast.error('Failed to save snapshot');
    }
  };

  const handleRestore = async (versionId) => {
    if (!window.confirm('Restore this version? current changes will be overwritten.')) return;
    try {
      const data = await restoreVersion(versionId);
      onRestore(data.file.content);
      toast.success('Version restored');
    } catch (err) {
      toast.error('Failed to restore version');
    }
  };

  return (
    <div className="version-history">
      <div className="history-header">
        <span className="history-title">History</span>
        {canEdit && (
          <button className="btn-save-snapshot" onClick={handleSnapshot}>
            📸 Snapshot
          </button>
        )}
      </div>

      <div className="history-list">
        {loading ? (
          <div className="history-loading">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="history-empty">No versions found.</div>
        ) : (
          history.map((v) => (
            <div key={v._id} className="history-item">
              <div className="history-item-info">
                <span className="history-date">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
                <span className="history-user">by {v.editedBy?.username}</span>
              </div>
              {canEdit && (
                <button
                  className="btn-restore-tiny"
                  onClick={() => handleRestore(v._id)}
                >
                  Restore
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
