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
    <div className="code-execution-panel">
      <div className="execution-header">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-text-secondary hover:text-text-primary transition"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
          <span className="execution-title">
            {isExecuting ? (
              <>
                <Zap size={13} className="text-warning" /> Executing...
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
          className="btn btn-ghost btn-sm"
          disabled={isExecuting}
        >
          Clear
        </button>
      </div>

      {isExpanded && (
        <div className="execution-output">
          {isExecuting ? (
            <div className="flex items-center gap-2 text-accent-hover">
              <Loader2 size={15} className="animate-spin" />
              <span>Running code...</span>
            </div>
          ) : output ? (
            <pre>{output}</pre>
          ) : (
            <div className="text-muted italic">
              No output yet. Press Ctrl+Enter or click Run to execute code.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeExecutionPanel;
