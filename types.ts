export interface ImageUpload {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
  mimeType: string;
}

export interface GenerationResult {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}