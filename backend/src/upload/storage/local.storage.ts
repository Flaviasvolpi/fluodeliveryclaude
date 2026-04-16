import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider } from './storage.interface';

@Injectable()
export class LocalStorage implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor() {
    this.baseDir = process.env.UPLOAD_DIR || './uploads';
    this.baseUrl = process.env.UPLOAD_BASE_URL || '/api/uploads';
  }

  async upload(bucket: string, filePath: string, file: Buffer, _contentType: string): Promise<string> {
    const dir = path.join(this.baseDir, bucket);
    fs.mkdirSync(dir, { recursive: true });
    const fullPath = path.join(dir, filePath);
    fs.writeFileSync(fullPath, file);
    return this.getPublicUrl(bucket, filePath);
  }

  getPublicUrl(bucket: string, filePath: string): string {
    return `${this.baseUrl}/${bucket}/${filePath}`;
  }

  async delete(bucket: string, filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, bucket, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
