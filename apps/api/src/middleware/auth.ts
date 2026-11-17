import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { AppError } from '../plugins/errorHandler';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthenticatedUser;
    user: AuthenticatedUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    const cookieToken = request.cookies.token;

    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const decoded = request.server.jwt.verify<AuthenticatedUser>(token);
    request.user = decoded;
  } catch (err) {
    throw new AppError('Invalid or expired authentication token', 401, 'UNAUTHORIZED');
  }
}

export function requireWorkspaceRole(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { workspaceId } = request.params as { workspaceId?: string };
    if (!workspaceId) {
      throw new AppError('Workspace ID is required', 400, 'BAD_REQUEST');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: request.user.id,
        },
      },
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new AppError('You do not have permission to perform this action in this workspace', 403, 'FORBIDDEN');
    }
  };
}
