import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { LoginInput, RegisterInput } from '@apihub/shared';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
      },
    });

    // Create initial personal workspace
    const baseSlug = input.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || 'workspace';
    const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: `${input.name}'s Workspace`,
        slug,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      defaultWorkspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return user;
  }
}

export const authService = new AuthService();
