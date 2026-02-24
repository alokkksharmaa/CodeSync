import api from './api';

/**
 * Execute code on the backend
 * @param {string} code - The code to execute
 * @param {string} language - Programming language (javascript, python, etc.)
 * @returns {Promise<{output: string, error: string}>}
 */
export const executeCode = async (code, language) => {
  try {
    const response = await api.post('/api/execute', {
      code,
      language: language.toLowerCase()
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Code execution failed');
  }
};
