import sharp from 'sharp';
import { storageService } from './storage.service.js';
import { assetService } from './asset.service.js';
import { createChildLogger } from '../utils/logger.js';
import { generateStorageKey } from '../utils/hash.js';
import { isImage, isTransformable } from '../utils/mime.js';

const logger = createChildLogger('thumbnail');

const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

export const thumbnailService = {
  async generateThumbnail(assetId: string, storageKey: string, mimeType: string): Promise<string | null> {
    if (!isImage(mimeType) || !isTransformable(mimeType)) {
      logger.debug({ assetId, mimeType }, 'Not a transformable image, skipping thumbnail');
      return null;
    }

    try {
      const originalBuffer = await storageService.getBuffer(storageKey);

      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .webp({ quality: 75 })
        .toBuffer();

      const thumbnailKey = generateStorageKey('thumbnails', '.webp');
      await storageService.upload(thumbnailKey, thumbnailBuffer, 'image/webp');

      await assetService.setThumbnail(assetId, thumbnailKey);

      logger.info({ assetId, thumbnailKey, size: thumbnailBuffer.length }, 'Thumbnail generated');
      return thumbnailKey;
    } catch (err) {
      logger.error({ err, assetId }, 'Failed to generate thumbnail');
      return null;
    }
  },

  async regenerateThumbnail(assetId: string): Promise<string | null> {
    const asset = await assetService.getById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Delete old thumbnail if exists
    if (asset.thumbnailKey) {
      try {
        await storageService.delete(asset.thumbnailKey);
      } catch {
        // Ignore cleanup errors
      }
    }

    return thumbnailService.generateThumbnail(assetId, asset.storageKey, asset.mimeType);
  },
};
