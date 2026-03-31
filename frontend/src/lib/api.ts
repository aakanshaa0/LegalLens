import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    // Get token from Clerk
    if (window.Clerk && window.Clerk.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return config;
});

// Helper to format bytes into a human-friendly size label
function formatSize(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export interface DocumentFile {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  sizeLabel: string;
  mimetype: string;
  fileType: string;
  uploadDate: string;
  userId: string;
  summary?: string;
}

export interface UploadResponse {
  message: string;
  file: DocumentFile;
}

export interface DocumentsResponse {
  message: string;
  files: DocumentFile[];
}

export interface DocumentContentResponse {
  content: string;
}

export interface SummaryResponse {
  summary: string;
}

export interface AskQuestionResponse {
  answer: string;
}

export const documentAPI = {
  // Document management
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('document', file);
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDocuments: async (): Promise<DocumentsResponse> => {
    const response = await api.get('/documents');
    const data = response.data;

    // Backend may return either an array of files or an object with { files }
    const rawFiles: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.files)
        ? data.files
        : [];

    const files: DocumentFile[] = rawFiles.map((f: any) => {
      const id = f.id || f._id || '';
      const originalName = f.originalName || f.name || f.filename || 'Untitled';
      const filename = f.fileName || f.filename || originalName;
      const size = typeof f.size === 'number' ? f.size : 0;
      const mimetype = f.mimeType || f.mimetype || 'application/octet-stream';
      const fileType = f.type || f.fileType || (typeof mimetype === 'string' ? mimetype.split('/')[1] : 'unknown');
      const uploadDate = f.uploadedAt || f.uploadDate || new Date().toISOString();
      const path = f.localPath || f.path || f.url || '';

      return {
        id,
        filename,
        originalName,
        path,
        size,
        sizeLabel: formatSize(size),
        mimetype,
        fileType,
        uploadDate,
        userId: f.userId || '',
        summary: f.summary,
      } as DocumentFile;
    });

    return {
      message: data?.message || 'OK',
      files,
    } as DocumentsResponse;
  },

  getDocument: async (id: string): Promise<{ file: DocumentFile }> => {
    const response = await api.get(`/documents/${id}`);
    const data = response.data;
    const file = data?.data || data?.file || data; // backend uses { success, data }

    const idVal = file.id || file._id || '';
    const originalName = file.originalName || file.name || file.filename || 'Untitled';
    const filename = file.fileName || file.filename || originalName;
    const size = typeof file.size === 'number' ? file.size : 0;
    const mimetype = file.mimeType || file.mimetype || 'application/octet-stream';
    const fileType = file.type || file.fileType || (typeof mimetype === 'string' ? mimetype.split('/')[1] : 'unknown');
    const uploadDate = file.uploadedAt || file.uploadDate || new Date().toISOString();
    const path = file.localPath || file.path || file.url || '';

    const mapped: DocumentFile = {
      id: idVal,
      filename,
      originalName,
      path,
      size,
      sizeLabel: formatSize(size),
      mimetype,
      fileType,
      uploadDate,
      userId: file.userId || '',
      summary: file.summary,
    };

    return { file: mapped };
  },

  getDocumentContent: async (documentId: string): Promise<DocumentContentResponse> => {
    const response = await api.get(`/documents/${documentId}/content`);
    const data = response.data;
    const content = data?.data?.content ?? data?.content ?? '';
    return { content };
  },

  deleteDocument: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Document processing
  summarize: async (documentId: string): Promise<SummaryResponse> => {
    const response = await api.get(`/documents/${documentId}/summary`);
    const data = response.data;
    const summary = data?.data?.summary ?? data?.summary ?? '';
    return { summary };
  },

  askQuestion: async (documentId: string, question: string): Promise<AskQuestionResponse> => {
    const response = await api.post(`/documents/${documentId}/ask`, { question });
    const data = response.data;
    // Backend returns { success: true, data: { response: "...", ... } }
    const answer = data?.data?.response ?? data?.response ?? data?.answer ?? '';
    return { answer };
  }
};