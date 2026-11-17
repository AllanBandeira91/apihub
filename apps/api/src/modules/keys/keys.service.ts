import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';

export class KeysService {
  async listByWorkspace(workspaceId: string) {
    return prisma.apiKey.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(workspaceId: string, name: string, permissions: string[] = ['read', 'write']) {
    // Generate secure random string
    const randomHex = crypto.randomBytes(24).toString('hex');
    const rawKey = `ah_live_${randomHex}`;
    const keyPrefix = rawKey.slice(0, 14); // "ah_live_xxxxxx"

    // SHA-256 hash
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const record = await prisma.apiKey.create({
      data: {
        workspaceId,
        name,
        keyPrefix,
        keyHash,
        permissions,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        createdAt: true,
      },
    });

    return {
      apiKey: record,
      // Full raw key returned ONLY this single time
      secretKey: rawKey,
    };
  }

  async revoke(workspaceId: string, keyId: string) {
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, workspaceId },
    });

    if (!key) {
      throw new AppError('API Key not found', 404, 'NOT_FOUND');
    }

    if (key.revokedAt) {
      throw new AppError('API Key is already revoked', 400, 'ALREADY_REVOKED');
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    return { message: 'API Key revoked successfully' };
  }
}

export const keysService = new KeysService();
