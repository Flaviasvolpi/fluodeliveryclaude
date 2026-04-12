import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { LocalStorage } from './storage/local.storage';

@Injectable()
export class UploadService {
  constructor(private storage: LocalStorage) {}

  async uploadFile(bucket: string, file: Express.Multer.File): Promise<{ url: string }> {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const url = await this.storage.upload(bucket, fileName, file.buffer, file.mimetype);
    return { url };
  }

  async deleteFile(bucket: string, fileName: string): Promise<void> {
    await this.storage.delete(bucket, fileName);
  }

  getPublicUrl(bucket: string, fileName: string): string {
    return this.storage.getPublicUrl(bucket, fileName);
  }
}
