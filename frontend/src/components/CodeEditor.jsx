import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ 
  value, 
  onChange, 
  language, 
  readOnly, 
  onExecute 
}) => {
  const editorRef = useRef(null);
  const valueRef = useRef(value);

  // Update ref when value changes from props
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    
    // Add keyboard shortcut for code execution (Ctrl+Enter or Cmd+Enter)
    editor.addCommand(
      window.navigator.platform.includes('Mac') 
        ? monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter 
        : monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        if (onExecute && !readOnly) {
          onExecute();
        }
      }
    );
  };

  const handleEditorChange = (newValue) => {
    if (!onChange || readOnly) return;
    
    // Monaco Editor passes undefined when content is cleared
    const safeValue = newValue ?? '';
    
    // Only trigger onChange if the value actually changed from user input
    // (not from programmatic updates via props)
    if (safeValue !== valueRef.current) {
      console.log('[CodeEditor] User edit detected:', { 
        language, 
        valueLength: safeValue.length 
      });
      onChange({ target: { value: safeValue } });
    }
  };

  // Map file extensions to Monaco language identifiers
  const getMonacoLanguage = (lang) => {
    const languageMap = {
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'python': 'python',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c++': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'cs': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'rs': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'rb': 'ruby',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'markdown': 'markdown',
      'md': 'markdown',
      'sql': 'sql',
      'shell': 'shell',
      'bash': 'shell',
      'sh': 'shell',
    };
    return languageMap[lang?.toLowerCase()] || 'plaintext';
  };

  return (
    <div className="relative w-full h-full">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          bracketPairColorization: { enabled: true },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
