import api from './api';

export const createFile = async (data) => {
  const res = await api.post('/api/files', { ...data, type: 'file' });
  return res.data;
};

export const createFolder = async (data) => {
  const res = await api.post('/api/files', { ...data, type: 'folder' });
  return res.data;
};

export const fetchFileContent = async (fileId) => {
  const res = await api.get(`/api/files/open/${fileId}`);
  return res.data;
};

export const updateFile = async (fileId, content) => {
  const res = await api.put(`/api/files/${fileId}`, { content });
  return res.data;
};

export const renameFile = async (fileId, name) => {
  const res = await api.patch(`/api/files/rename/${fileId}`, { name });
  return res.data;
};

export const deleteFile = async (fileId) => {
  const res = await api.delete(`/api/files/${fileId}`);
  return res.data;
};

export const saveVersion = async (fileId) => {
  const res = await api.post(`/api/files/${fileId}/version`);
  return res.data;
};

export const fetchHistory = async (fileId) => {
  const res = await api.get(`/api/files/${fileId}/history`);
  return res.data;
};

export const restoreVersion = async (versionId) => {
  const res = await api.post(`/api/files/restore/${versionId}`);
  return res.data;
};
