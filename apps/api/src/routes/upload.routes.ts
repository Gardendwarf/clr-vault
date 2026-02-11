import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { storageService } from '../services/storage.service.js';
import { assetService } from '../services/asset.service.js';
import { requireAuth } from '../middleware/auth.js';
import { requireApiKey, requirePermission } from '../middleware/api-key.js';
import { success, errors } from '../utils/response.js';
import { validateZod } from '../utils/validation.js';
import { generateStorageKey, sha256 } from '../utils/hash.js';
import { getExtension } from '../utils/mime.js';

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

const multipartInitSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  parts: z.number().int().min(1).max(10000),
});

const multipartPartSchema = z.object({
  uploadId: z.string().min(1),
  storageKey: z.string().min(1),
  partNumber: z.number().int().min(1),
});

const multipartCompleteSchema = z.object({
  uploadId: z.string().min(1),
  storageKey: z.string().min(1),
  assetId: z.string().uuid(),
  parts: z.array(
    z.object({
      partNumber: z.number().int().min(1),
      etag: z.string().min(1),
    })
  ),
});

export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/upload/presign — presigned URL for direct upload to R2
  app.post(
    '/presign',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const validation = validateZod(presignSchema, request.body);
      if (!validation.success) {
        return errors.validation(reply, validation.errors);
      }

      const { filename, mimeType, sizeBytes } = validation.data;
      const ext = getExtension(mimeType) || '';
      const storageKey = generateStorageKey('assets', ext);
      const contentHash = sha256(`${filename}:${sizeBytes}:${Date.now()}`);

      // Create asset record in PROCESSING state
      const asset = await assetService.createFromPresigned({
        filename,
        originalName: filename,
        mimeType,
        sizeBytes,
        storageKey,
        contentHash,
      });

      const uploadUrl = await storageService.getPresignedUploadUrl(storageKey, mimeType);

      success(reply, {
        uploadUrl,
        storageKey,
        assetId: asset.id,
      });
    }
  );

  // POST /api/upload/presign-apikey — presigned URL using API key auth
  app.post(
    '/presign-apikey',
    { preHandler: [requireApiKey, requirePermission('write')] },
    async (request, reply) => {
      const validation = validateZod(presignSchema, request.body);
      if (!validation.success) {
        return errors.validation(reply, validation.errors);
      }

      const { filename, mimeType, sizeBytes } = validation.data;
      const apiKey = request.apiKey!;

      // Check quota
      const remaining = Number(apiKey.quotaBytes - apiKey.usedBytes);
      if (sizeBytes > remaining) {
        return errors.badRequest(reply, 'Storage quota exceeded');
      }

      const ext = getExtension(mimeType) || '';
      const storageKey = generateStorageKey('assets', ext);
      const contentHash = sha256(`${filename}:${sizeBytes}:${Date.now()}`);

      const asset = await assetService.createFromPresigned({
        filename,
        originalName: filename,
        mimeType,
        sizeBytes,
        storageKey,
        contentHash,
        apiKeyId: apiKey.id,
      });

      const uploadUrl = await storageService.getPresignedUploadUrl(storageKey, mimeType);

      success(reply, {
        uploadUrl,
        storageKey,
        assetId: asset.id,
      });
    }
  );

  // POST /api/upload/multipart/init
  app.post(
    '/multipart/init',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const validation = validateZod(multipartInitSchema, request.body);
      if (!validation.success) {
        return errors.validation(reply, validation.errors);
      }

      const { filename, mimeType, sizeBytes, parts } = validation.data;
      const ext = getExtension(mimeType) || '';
      const storageKey = generateStorageKey('assets', ext);
      const contentHash = sha256(`${filename}:${sizeBytes}:${Date.now()}`);

      const uploadId = await storageService.initiateMultipartUpload(storageKey, mimeType);

      const asset = await assetService.createFromPresigned({
        filename,
        originalName: filename,
        mimeType,
        sizeBytes,
        storageKey,
        contentHash,
      });

      success(reply, {
        uploadId,
        storageKey,
        assetId: asset.id,
        totalParts: parts,
      });
    }
  );

  // POST /api/upload/multipart/part
  app.post(
    '/multipart/part',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const validation = validateZod(multipartPartSchema, request.body);
      if (!validation.success) {
        return errors.validation(reply, validation.errors);
      }

      const { uploadId, storageKey, partNumber } = validation.data;
      const presignedUrl = await storageService.getPresignedPartUrl(
        storageKey,
        uploadId,
        partNumber
      );

      success(reply, { presignedUrl });
    }
  );

  // POST /api/upload/multipart/complete
  app.post(
    '/multipart/complete',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const validation = validateZod(multipartCompleteSchema, request.body);
      if (!validation.success) {
        return errors.validation(reply, validation.errors);
      }

      const { uploadId, storageKey, assetId, parts } = validation.data;

      try {
        await storageService.completeMultipartUpload(
          storageKey,
          uploadId,
          parts.map((p) => ({
            PartNumber: p.partNumber,
            ETag: p.etag,
          }))
        );

        const asset = await assetService.getById(assetId);
        success(reply, asset);
      } catch (err) {
        // Abort the multipart upload on failure
        try {
          await storageService.abortMultipartUpload(storageKey, uploadId);
        } catch {
          // Ignore abort errors
        }
        return errors.internal(reply, 'Failed to complete multipart upload');
      }
    }
  );
}
