import { config } from '../config.js';
import { assetService } from './asset.service.js';
import { thumbnailService } from './thumbnail.service.js';
import { metadataService } from './metadata.service.js';
import { authService } from './auth.service.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('worker');

let thumbnailInterval: NodeJS.Timeout | null = null;
let metadataInterval: NodeJS.Timeout | null = null;
let usageInterval: NodeJS.Timeout | null = null;

async function processThumbnails() {
  try {
    const assets = await assetService.getProcessingAssets(10);
    for (const asset of assets) {
      await thumbnailService.generateThumbnail(asset.id, asset.storageKey, asset.mimeType);
    }
  } catch (err) {
    logger.error({ err }, 'Thumbnail worker error');
  }
}

async function processMetadata() {
  try {
    const assets = await assetService.getProcessingAssets(10);
    for (const asset of assets) {
      await metadataService.extractMetadata(asset.id, asset.storageKey, asset.mimeType);
    }
  } catch (err) {
    logger.error({ err }, 'Metadata worker error');
  }
}

async function processUsageAggregation() {
  try {
    // Clean expired refresh tokens
    const cleaned = await authService.cleanExpiredTokens();
    if (cleaned > 0) {
      logger.info({ count: cleaned }, 'Cleaned expired refresh tokens');
    }
  } catch (err) {
    logger.error({ err }, 'Usage aggregation worker error');
  }
}

export const workerService = {
  start() {
    const pollInterval = config.WORKER_POLL_INTERVAL_MS;

    if (config.THUMBNAIL_WORKER_ENABLED) {
      logger.info({ interval: pollInterval }, 'Starting thumbnail worker');
      thumbnailInterval = setInterval(processThumbnails, pollInterval);
      // Run once immediately
      processThumbnails();
    }

    if (config.METADATA_WORKER_ENABLED) {
      logger.info({ interval: pollInterval }, 'Starting metadata worker');
      metadataInterval = setInterval(processMetadata, pollInterval);
      // Stagger start to avoid processing same assets
      setTimeout(processMetadata, pollInterval / 2);
    }

    if (config.USAGE_AGGREGATION_ENABLED) {
      const aggregationInterval = 60 * 60 * 1000; // 1 hour
      logger.info({ interval: aggregationInterval }, 'Starting usage aggregation worker');
      usageInterval = setInterval(processUsageAggregation, aggregationInterval);
    }
  },

  stop() {
    if (thumbnailInterval) {
      clearInterval(thumbnailInterval);
      thumbnailInterval = null;
      logger.info('Thumbnail worker stopped');
    }
    if (metadataInterval) {
      clearInterval(metadataInterval);
      metadataInterval = null;
      logger.info('Metadata worker stopped');
    }
    if (usageInterval) {
      clearInterval(usageInterval);
      usageInterval = null;
      logger.info('Usage aggregation worker stopped');
    }
  },
};
