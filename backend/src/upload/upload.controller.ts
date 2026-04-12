import {
  Controller, Get, Post, Delete, Param, Res,
  UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { UploadService } from './upload.service';
import { Roles, Public } from '../common/decorators';

@Controller('uploads')
export class UploadController {
  constructor(private service: UploadService) {}

  @Post('product-images')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.service.uploadFile('product-images', file);
  }

  @Post('site-assets')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadSiteAsset(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.service.uploadFile('site-assets', file);
  }

  @Public()
  @Get(':bucket/:filename')
  serveFile(
    @Param('bucket') bucket: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const baseDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(baseDir, bucket, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }

    return res.sendFile(path.resolve(filePath));
  }

  @Delete(':bucket/:filename')
  @Roles('admin')
  deleteFile(@Param('bucket') bucket: string, @Param('filename') filename: string) {
    return this.service.deleteFile(bucket, filename);
  }
}
