import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Terminal,
  Zap,
} from "lucide-react";

const CodeExecutionPanel = ({ output, isExecuting, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="code-execution-panel flex flex-col bg-gray-900/60 border-t border-gray-800/60">
      <div className="execution-header flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-200 transition"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
          <span className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            {isExecuting ? (
              <>
                <Zap size={13} className="text-yellow-400" /> Executing...
              </>
            ) : (
              <>
                <Terminal size={13} /> Output
              </>
            )}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-xs px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-700/60 text-gray-400 hover:text-gray-200 transition"
          disabled={isExecuting}
        >
          Clear
        </button>
      </div>

      {isExpanded && (
        <div className="execution-output flex-1 overflow-auto p-4 font-mono text-sm text-gray-300 min-h-[120px] max-h-[300px]">
          {isExecuting ? (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 size={15} className="animate-spin" />
              <span>Running code...</span>
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap">{output}</pre>
          ) : (
            <div className="text-gray-500 italic">
              No output yet. Press Ctrl+Enter or click Run to execute code.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeExecutionPanel;
