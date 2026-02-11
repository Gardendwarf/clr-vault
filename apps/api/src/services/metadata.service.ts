import sharp from 'sharp';
import { storageService } from './storage.service.js';
import { assetService } from './asset.service.js';
import { createChildLogger } from '../utils/logger.js';
import { isImage, isTransformable } from '../utils/mime.js';

const logger = createChildLogger('metadata');

export const metadataService = {
  async extractMetadata(
    assetId: string,
    storageKey: string,
    mimeType: string
  ): Promise<Record<string, unknown> | null> {
    try {
      if (isImage(mimeType) && isTransformable(mimeType)) {
        return await extractImageMetadata(assetId, storageKey);
      }

      // For non-image files, mark as active with basic metadata
      await assetService.updateStatus(assetId, 'ACTIVE', {
        extractedAt: new Date().toISOString(),
        type: mimeType,
      });

      return null;
    } catch (err) {
      logger.error({ err, assetId }, 'Failed to extract metadata');
      await assetService.updateStatus(assetId, 'ERROR', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return null;
    }
  },
};

async function extractImageMetadata(
  assetId: string,
  storageKey: string
): Promise<Record<string, unknown>> {
  const buffer = await storageService.getBuffer(storageKey);
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const result: Record<string, unknown> = {
    format: metadata.format,
    space: metadata.space,
    channels: metadata.channels,
    depth: metadata.depth,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
    extractedAt: new Date().toISOString(),
  };

  // Extract EXIF data if available
  if (metadata.exif) {
    try {
      const exifReader = await import('exif-reader');
      const exifData = exifReader.default(metadata.exif);
      result.exif = {
        make: exifData?.Image?.Make,
        model: exifData?.Image?.Model,
        dateTime: exifData?.Image?.DateTime,
        exposureTime: exifData?.Photo?.ExposureTime,
        fNumber: exifData?.Photo?.FNumber,
        iso: exifData?.Photo?.ISOSpeedRatings,
        focalLength: exifData?.Photo?.FocalLength,
        flash: exifData?.Photo?.Flash,
      };

      // GPS data
      if (exifData?.GPSInfo) {
        result.gps = {
          latitude: exifData.GPSInfo.GPSLatitude,
          longitude: exifData.GPSInfo.GPSLongitude,
          altitude: exifData.GPSInfo.GPSAltitude,
        };
      }
    } catch {
      logger.debug({ assetId }, 'No EXIF data or failed to parse');
    }
  }

  // Update asset dimensions and metadata
  if (metadata.width && metadata.height) {
    await assetService.setDimensions(assetId, metadata.width, metadata.height);
  }

  await assetService.updateStatus(assetId, 'ACTIVE', result);

  logger.info(
    { assetId, width: metadata.width, height: metadata.height, format: metadata.format },
    'Image metadata extracted'
  );

  return result;
}
