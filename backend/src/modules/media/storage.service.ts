import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import { AppError } from '../../middlewares/error.middleware';
import { MediaType } from '@prisma/client';

export class StorageService {
  private static uploadsBaseDir = path.join(process.cwd(), 'uploads');

  /**
   * Determine MediaType from MIME type
   */
  public static resolveMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }

  /**
   * Build partitioned storage key: media/YYYY/MM/DD/uuid-filename.ext
   */
  public static generateStoragePath(originalName: string): {
    storageKey: string;
    absolutePath: string;
    publicUrl: string;
    fileName: string;
  } {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const relativeFolder = path.join('media', String(year), month, day);
    const targetDir = path.join(this.uploadsBaseDir, relativeFolder);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uniqueId = crypto.randomUUID();
    const ext = path.extname(originalName).toLowerCase();
    const safeBaseName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);

    const fileName = `${uniqueId}-${safeBaseName}${ext}`;
    const absolutePath = path.join(targetDir, fileName);
    const storageKey = `media/${year}/${month}/${day}/${fileName}`;
    const publicUrl = `/uploads/media/${year}/${month}/${day}/${fileName}`;

    return {
      storageKey,
      absolutePath,
      publicUrl,
      fileName,
    };
  }

  /**
   * Multer upload middleware configured for multi-part file uploads
   */
  public static getMulterUpload() {
    const storage = multer.diskStorage({
      destination: (_req, file, cb) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const targetDir = path.join(StorageService.uploadsBaseDir, 'media', String(year), month, day);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
      },
      filename: (_req, file, cb) => {
        const uniqueId = crypto.randomUUID();
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBaseName = path
          .basename(file.originalname, ext)
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 40);
        cb(null, `${uniqueId}-${safeBaseName}${ext}`);
      },
    });

    return multer({
      storage,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB max for videos/docs
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/avif',
          'image/gif',
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'audio/mpeg',
          'audio/wav',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimes.includes(file.mimetype.toLowerCase())) {
          cb(null, true);
        } else {
          cb(new AppError(`Unsupported media type: ${file.mimetype}`, 400, 'MEDIA_INVALID_TYPE'));
        }
      },
    });
  }
}
