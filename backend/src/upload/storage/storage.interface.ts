export interface StorageProvider {
  upload(bucket: string, path: string, file: Buffer, contentType: string): Promise<string>;
  getPublicUrl(bucket: string, path: string): string;
  delete(bucket: string, path: string): Promise<void>;
}
