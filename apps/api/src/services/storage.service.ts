import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  type CompletedPart,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('storage');

const s3 = new S3Client({
  endpoint: config.R2_ENDPOINT,
  region: config.R2_REGION,
  credentials: {
    accessKeyId: config.R2_ACCESS_KEY_ID,
    secretAccessKey: config.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export const storageService = {
  async upload(key: string, body: Buffer | ReadableStream, contentType: string): Promise<void> {
    logger.debug({ key, contentType }, 'Uploading object');
    await s3.send(
      new PutObjectCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
        Body: body as Buffer,
        ContentType: contentType,
      })
    );
  },

  async download(key: string): Promise<{ body: ReadableStream | null; contentType: string; contentLength: number }> {
    logger.debug({ key }, 'Downloading object');
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
      })
    );
    return {
      body: res.Body?.transformToWebStream() ?? null,
      contentType: res.ContentType || 'application/octet-stream',
      contentLength: res.ContentLength || 0,
    };
  },

  async getBuffer(key: string): Promise<Buffer> {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
      })
    );
    const bytes = await res.Body?.transformToByteArray();
    return Buffer.from(bytes || []);
  },

  async delete(key: string): Promise<void> {
    logger.debug({ key }, 'Deleting object');
    await s3.send(
      new DeleteObjectCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
      })
    );
  },

  async exists(key: string): Promise<boolean> {
    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket: config.R2_BUCKET,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  },

  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(s3, command, { expiresIn });
  },

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: key,
    });
    return getSignedUrl(s3, command, { expiresIn });
  },

  async initiateMultipartUpload(key: string, contentType: string): Promise<string> {
    const res = await s3.send(
      new CreateMultipartUploadCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
        ContentType: contentType,
      })
    );
    return res.UploadId!;
  },

  async getPresignedPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresIn = 3600
  ): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: config.R2_BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return getSignedUrl(s3, command, { expiresIn });
  },

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPart[]
  ): Promise<void> {
    await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })
    );
  },

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await s3.send(
      new AbortMultipartUploadCommand({
        Bucket: config.R2_BUCKET,
        Key: key,
        UploadId: uploadId,
      })
    );
  },

  getPublicUrl(key: string): string | null {
    if (config.R2_PUBLIC_URL) {
      return `${config.R2_PUBLIC_URL}/${key}`;
    }
    return null;
  },
};
