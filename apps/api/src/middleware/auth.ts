import { jwtVerify } from 'jose';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { errors } from '../utils/response.js';
import { config } from '../config.js';

const SUPABASE_JWT_SECRET = config.SUPABASE_JWT_SECRET || '';
const CLRHUB_URL = config.CLRHUB_URL || 'https://hub.clrtech.xyz';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthPayload;
    supabaseId?: string;
    hubUser?: any;
  }
}

interface SupabaseJwtPayload {
  sub: string;
  email: string;
  role: string;
  iss: string;
}

// Cache for hub profile lookups (5 min TTL)
const profileCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function verifySupabaseJwt(
  token: string,
  request: FastifyRequest,
): Promise<AuthPayload | null> {
  try {
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const jwtPayload = payload as unknown as SupabaseJwtPayload;

    if (!jwtPayload.sub || !jwtPayload.email) {
      return null;
    }

    (request as any).supabaseId = jwtPayload.sub;

    const authPayload: AuthPayload = {
      userId: jwtPayload.sub,
      email: jwtPayload.email,
      role: jwtPayload.role || 'authenticated',
    };

    // Check cache for enriched profile
    const cached = profileCache.get(jwtPayload.sub);
    if (cached && cached.expiry > Date.now()) {
      (request as any).hubUser = cached.data;
      return authPayload;
    }

    // Fetch enriched profile from clrHub
    try {
      const res = await fetch(`${CLRHUB_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        (request as any).hubUser = profile.user || profile;
        profileCache.set(jwtPayload.sub, {
          data: (request as any).hubUser,
          expiry: Date.now() + CACHE_TTL,
        });
      }
    } catch {
      // Hub unavailable — proceed with basic JWT info
    }

    return authPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errors.unauthorized(reply, 'Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const authPayload = await verifySupabaseJwt(token, request);

  if (!authPayload) {
    return errors.unauthorized(reply, 'Invalid or expired token');
  }

  request.authUser = authPayload;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) return;

  // Check hubUser for admin role, or fall back to JWT role
  const hubUser = (request as any).hubUser;
  const isAdmin =
    request.authUser?.role === 'ADMIN' ||
    request.authUser?.role === 'service_role' ||
    hubUser?.role === 'ADMIN';

  if (!isAdmin) {
    return errors.forbidden(reply, 'Admin access required');
  }
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return;
  }

  const token = authHeader.substring(7);
  const authPayload = await verifySupabaseJwt(token, request);

  if (authPayload) {
    request.authUser = authPayload;
  }
}
