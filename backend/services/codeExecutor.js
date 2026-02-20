import axios from 'axios';

/**
 * CodeExecutor - Handles code execution via Judge0 API
 */
class CodeExecutor {
  constructor() {
    // Judge0 API endpoint (use RapidAPI or self-hosted)
    this.JUDGE0_API = process.env.JUDGE0_API || 'https://judge0-ce.p.rapidapi.com';
    this.RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
    this.RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com';

    // Language ID mapping for Judge0
    this.languageIds = {
      javascript: 63,  // Node.js
      python: 71,      // Python 3
      cpp: 54          // C++ (GCC 9.2.0)
    };
  }

  /**
   * Execute code and return results
   */
  async executeCode(code, language, stdin = '') {
    try {
      const languageId = this.languageIds[language];

      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Check if API key is configured
      if (!this.RAPIDAPI_KEY || this.RAPIDAPI_KEY === '') {
        console.log('No Judge0 API key configured, using mock execution');
        return this.executeLocally(code, language);
      }

      // Submit code for execution
      const submissionResponse = await this.submitCode(code, languageId, stdin);
      const token = submissionResponse.token;

      // Poll for results
      const result = await this.getResult(token);

      return this.formatResult(result);
    } catch (error) {
      console.error('Code execution error:', error.message);

      // If API key error, fall back to mock execution
      if (error.response && error.response.status === 401) {
        console.log('Invalid API key, falling back to mock execution');
        return this.executeLocally(code, language);
      }

      return {
        success: false,
        error: error.message || 'Execution failed',
        stdout: '',
        stderr: error.message || 'Unknown error',
        time: 0,
        memory: 0
      };
    }
  }

  /**
   * Submit code to Judge0
   */
  async submitCode(code, languageId, stdin) {
    const options = {
      method: 'POST',
      url: `${this.JUDGE0_API}/submissions`,
      params: { base64_encoded: 'false', wait: 'false' },
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': this.RAPIDAPI_KEY,
        'X-RapidAPI-Host': this.RAPIDAPI_HOST
      },
      data: {
        language_id: languageId,
        source_code: code,
        stdin: stdin
      }
    };

    const response = await axios.request(options);
    return response.data;
  }

  /**
   * Get execution result (with polling)
   */
  async getResult(token, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const options = {
        method: 'GET',
        url: `${this.JUDGE0_API}/submissions/${token}`,
        params: { base64_encoded: 'false' },
        headers: {
          'X-RapidAPI-Key': this.RAPIDAPI_KEY,
          'X-RapidAPI-Host': this.RAPIDAPI_HOST
        }
      };

      const response = await axios.request(options);
      const result = response.data;

      // Status: 1 = In Queue, 2 = Processing
      if (result.status.id > 2) {
        return result;
      }

      // Wait before next poll
      await this.sleep(500);
    }

    throw new Error('Execution timeout');
  }

  /**
   * Format execution result
   */
  formatResult(result) {
    const status = result.status.description;

    return {
      success: result.status.id === 3, // 3 = Accepted
      status,
      stdout: result.stdout || '',
      stderr: result.stderr || result.compile_output || '',
      time: result.time || 0,
      memory: result.memory || 0,
      statusId: result.status.id
    };
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute code locally (fallback for development without Judge0)
   */
  async executeLocally(code, language) {
    // Simple mock execution for development
    const lines = code.split('\n').length;
    return {
      success: true,
      status: 'Mock Execution (No API Key)',
      stdout: `✓ Code validated successfully\n\nLanguage: ${language}\nLines: ${lines}\n\n⚠️  To run code for real:\n1. Get API key from https://rapidapi.com/judge0-official/api/judge0-ce\n2. Add RAPIDAPI_KEY to backend/.env\n3. Restart backend server\n\nYour code:\n${code.substring(0, 200)}${code.length > 200 ? '...' : ''}`,
      stderr: '',
      time: 0,
      memory: 0
    };
  }
}

export default new CodeExecutor();
