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
    <div className="version-history bg-gray-900/40 backdrop-blur-xl border border-gray-700/60 rounded-xl overflow-hidden flex flex-col h-full max-h-[400px]">
      <div className="history-header flex items-center justify-between px-4 py-3 border-b border-gray-700/60 bg-gray-800/40">
        <span className="history-title text-sm font-semibold tracking-wider text-gray-400 uppercase">History</span>
        {canEdit && (
          <button className="btn-save-snapshot text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-500/20" onClick={handleSnapshot}>
            <span className="opacity-80">📸</span> Snapshot
          </button>
        )}
      </div>

      <div className="history-list flex-1 overflow-y-auto p-3 custom-scrollbar">
        {loading ? (
          <div className="history-loading text-sm text-gray-500 text-center py-4">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="history-empty text-sm text-gray-500 text-center py-4 italic">No versions found.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((v) => (
              <div key={v._id} className="history-item flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700/40 rounded-lg transition-colors group">
                <div className="history-item-info flex flex-col">
                  <span className="history-date text-sm font-medium text-gray-300">
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                  <span className="history-user text-xs text-gray-500">by <span className="text-gray-400">{v.editedBy?.username}</span></span>
                </div>
                {canEdit && (
                  <button
                    className="btn-restore-tiny text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    onClick={() => handleRestore(v._id)}
                  >
                    Restore
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
