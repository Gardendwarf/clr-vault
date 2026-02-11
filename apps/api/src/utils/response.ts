import type { FastifyReply } from 'fastify';

export function success<T>(reply: FastifyReply, data: T, statusCode = 200) {
  reply.status(statusCode).send({ success: true, data });
}

function error(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode: number,
  details?: unknown
) {
  reply.status(statusCode).send({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

export const errors = {
  unauthorized: (reply: FastifyReply, msg = 'Unauthorized') =>
    error(reply, 'UNAUTHORIZED', msg, 401),
  forbidden: (reply: FastifyReply, msg = 'Forbidden') =>
    error(reply, 'FORBIDDEN', msg, 403),
  notFound: (reply: FastifyReply, resource = 'Resource') =>
    error(reply, 'NOT_FOUND', `${resource} not found`, 404),
  badRequest: (reply: FastifyReply, msg: string, details?: unknown) =>
    error(reply, 'BAD_REQUEST', msg, 400, details),
  validation: (reply: FastifyReply, details: unknown) =>
    error(reply, 'VALIDATION_ERROR', 'Validation failed', 400, details),
  conflict: (reply: FastifyReply, msg: string) =>
    error(reply, 'CONFLICT', msg, 409),
  internal: (reply: FastifyReply, msg = 'Internal server error') =>
    error(reply, 'INTERNAL_ERROR', msg, 500),
  tooLarge: (reply: FastifyReply, msg = 'File too large') =>
    error(reply, 'TOO_LARGE', msg, 413),
  rateLimited: (reply: FastifyReply, msg = 'Rate limit exceeded') =>
    error(reply, 'RATE_LIMITED', msg, 429),
};
