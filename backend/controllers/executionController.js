import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Execute code locally using system compilers/interpreters
 * Simple and reliable - uses python, gcc, g++, java, node directly
 */
const executeLocally = async (code, language) => {
  const lang = language.toLowerCase();
  const tempDir = join(tmpdir(), 'codesync');
  const timestamp = Date.now();
  
  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }
  
  return new Promise(async (resolve, reject) => {
    try {
      let command, args, filePath, needsCleanup = [];
      
      if (lang === 'javascript' || lang === 'js' || lang === 'node') {
        // Node.js execution
        filePath = join(tempDir, `code_${timestamp}.js`);
        await writeFile(filePath, code);
        needsCleanup.push(filePath);
        command = 'node';
        args = [filePath];
        
      } else if (lang === 'python' || lang === 'py') {
        // Python execution
        filePath = join(tempDir, `code_${timestamp}.py`);
        await writeFile(filePath, code);
        needsCleanup.push(filePath);
        command = 'python';
        args = [filePath];
        
      } else if (lang === 'java') {
        // Java execution
        filePath = join(tempDir, 'Main.java');
        await writeFile(filePath, code);
        needsCleanup.push(filePath);
        
        // Compile first
        const compileProcess = spawn('javac', [filePath]);
        let compileError = '';
        
        compileProcess.stderr.on('data', (data) => {
          compileError += data.toString();
        });
        
        await new Promise((res, rej) => {
          compileProcess.on('close', (code) => {
            if (code !== 0) {
              rej(new Error(compileError || 'Compilation failed'));
            } else {
              res();
            }
          });
          compileProcess.on('error', (err) => {
            rej(new Error(`javac not found. Install Java JDK: ${err.message}`));
          });
        });
        
        // Then run
        needsCleanup.push(join(tempDir, 'Main.class'));
        command = 'java';
        args = ['-cp', tempDir, 'Main'];
        
      } else if (lang === 'c') {
        // C execution
        filePath = join(tempDir, `code_${timestamp}.c`);
        const exePath = join(tempDir, `code_${timestamp}.exe`);
        await writeFile(filePath, code);
        needsCleanup.push(filePath, exePath);
        
        // Compile
        const compileProcess = spawn('gcc', [filePath, '-o', exePath]);
        let compileError = '';
        
        compileProcess.stderr.on('data', (data) => {
          compileError += data.toString();
        });
        
        await new Promise((res, rej) => {
          compileProcess.on('close', (code) => {
            if (code !== 0) {
              rej(new Error(compileError || 'Compilation failed'));
            } else {
              res();
            }
          });
          compileProcess.on('error', (err) => {
            rej(new Error(`gcc not found. Install MinGW-w64 or GCC: ${err.message}`));
          });
        });
        
        command = exePath;
        args = [];
        
      } else if (lang === 'cpp' || lang === 'c++') {
        // C++ execution
        filePath = join(tempDir, `code_${timestamp}.cpp`);
        const exePath = join(tempDir, `code_${timestamp}.exe`);
        await writeFile(filePath, code);
        needsCleanup.push(filePath, exePath);
        
        // Compile
        const compileProcess = spawn('g++', [filePath, '-o', exePath]);
        let compileError = '';
        
        compileProcess.stderr.on('data', (data) => {
          compileError += data.toString();
        });
        
        await new Promise((res, rej) => {
          compileProcess.on('close', (code) => {
            if (code !== 0) {
              rej(new Error(compileError || 'Compilation failed'));
            } else {
              res();
            }
          });
          compileProcess.on('error', (err) => {
            rej(new Error(`g++ not found. Install MinGW-w64 or G++: ${err.message}`));
          });
        });
        
        command = exePath;
        args = [];
        
      } else {
        throw new Error(`Language ${language} not supported. Supported: JavaScript, Python, Java, C, C++`);
      }
      
      // Execute the code
      const process = spawn(command, args);
      let output = '';
      let error = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        process.kill();
        reject(new Error('Execution timeout (10 seconds)'));
      }, 10000);
      
      process.on('close', async (code) => {
        clearTimeout(timeout);
        
        // Cleanup temp files
        for (const file of needsCleanup) {
          try {
            await unlink(file);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        
        resolve({ output, error });
      });
      
      process.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`${command} not found or failed to execute: ${err.message}`));
      });
      
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Execute code using local compilers/interpreters
 * Supports: JavaScript (Node.js), Python, Java, C, C++
 */
export const executeCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    const lang = language.toLowerCase();

    try {
      const result = await executeLocally(code, lang);
      return res.json({
        output: result.output || 'Code executed successfully (no output)',
        error: result.error || ''
      });
    } catch (err) {
      return res.json({ 
        output: '', 
        error: err.message 
      });
    }

  } catch (err) {
    console.error('Execution error:', err);
    res.status(500).json({ error: 'Internal server error during code execution' });
  }
};
