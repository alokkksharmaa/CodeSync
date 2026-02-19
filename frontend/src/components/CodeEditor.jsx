/**
 * CodeEditor - Simple textarea-based code editor
 * Handles real-time text changes
 */
function CodeEditor({ code, onChange }) {
  
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="editor-wrapper">
      <textarea
        className="code-editor"
        value={code}
        onChange={handleChange}
        placeholder="Start typing code..."
        spellCheck="false"
      />
    </div>
  );
}

export default CodeEditor;
