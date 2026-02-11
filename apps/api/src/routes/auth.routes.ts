import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import { success, errors } from '../utils/response.js';
import { emailSchema, passwordSchema, validateZod } from '../utils/validation.js';

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().uuid(),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post('/register', async (request, reply) => {
    const validation = validateZod(registerSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const { email, password, name } = validation.data;

    try {
      const user = await authService.register(email, password, name);
      const accessToken = app.jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
      );
      const refreshToken = await authService.createRefreshToken(
        user.id,
        config.JWT_REFRESH_EXPIRES_IN
      );

      success(reply, {
        user: authService.sanitizeUser(user),
        tokens: { accessToken, refreshToken },
      }, 201);
    } catch (err) {
      if (err instanceof Error && err.message === 'Email already registered') {
        return errors.conflict(reply, err.message);
      }
      return errors.internal(reply);
    }
  });

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const validation = validateZod(loginSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    const { email, password } = validation.data;

    try {
      const user = await authService.login(email, password);
      const accessToken = app.jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
      );
      const refreshToken = await authService.createRefreshToken(
        user.id,
        config.JWT_REFRESH_EXPIRES_IN
      );

      success(reply, {
        user: authService.sanitizeUser(user),
        tokens: { accessToken, refreshToken },
      });
    } catch (err) {
      if (err instanceof Error) {
        return errors.unauthorized(reply, err.message);
      }
      return errors.internal(reply);
    }
  });

  // POST /api/auth/refresh
  app.post('/refresh', async (request, reply) => {
    const validation = validateZod(refreshSchema, request.body);
    if (!validation.success) {
      return errors.validation(reply, validation.errors);
    }

    try {
      const tokenRecord = await authService.verifyRefreshToken(validation.data.refreshToken);
      const user = tokenRecord.user;

      // Revoke old token
      await authService.revokeRefreshToken(validation.data.refreshToken);

      // Issue new tokens
      const accessToken = app.jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
      );
      const refreshToken = await authService.createRefreshToken(
        user.id,
        config.JWT_REFRESH_EXPIRES_IN
      );

      success(reply, {
        user: authService.sanitizeUser(user),
        tokens: { accessToken, refreshToken },
      });
    } catch (err) {
      if (err instanceof Error) {
        return errors.unauthorized(reply, err.message);
      }
      return errors.internal(reply);
    }
  });

  // POST /api/auth/logout
  app.post('/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    if (body.refreshToken) {
      await authService.revokeRefreshToken(body.refreshToken);
    } else if (request.authUser) {
      await authService.revokeAllUserTokens(request.authUser.userId);
    }
    success(reply, { message: 'Logged out successfully' });
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const { prisma } = await import('../utils/prisma.js');
    const user = await prisma.user.findUnique({
      where: { id: request.authUser!.userId },
    });

    if (!user) {
      return errors.notFound(reply, 'User');
    }

    success(reply, authService.sanitizeUser(user));
  });
}
