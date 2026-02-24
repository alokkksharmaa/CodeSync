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
          <button className="btn btn-sm btn-secondary" onClick={handleSnapshot}>
            <span className="opacity-80">📸</span> Snapshot
          </button>
        )}
      </div>

      <div className="history-list flex-1 overflow-y-auto p-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-gray-500 gap-3 py-8">
            <span className="spinner"></span>
            <p className="text-sm">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-gray-700/60 rounded-xl bg-gray-800/20 m-2">
            <span className="text-2xl mb-2 text-gray-600 opacity-50">⏱️</span>
            <p className="text-sm text-gray-400">No versions found.</p>
          </div>
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
                    className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 focus:opacity-100"
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
