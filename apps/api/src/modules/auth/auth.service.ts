import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../plugins/errorHandler';
import { LoginInput, RegisterInput } from '@apihub/shared';
import { validateRealEmail } from './email-validator';
import { sendVerificationEmail } from './mailer';

export class AuthService {
  async sendVerificationCode(email: string, type: 'REGISTER' | 'PASSWORD_RESET' = 'REGISTER') {
    const validEmail = await validateRealEmail(email);

    const existing = await prisma.user.findUnique({
      where: { email: validEmail },
    });

    if (type === 'REGISTER' && existing) {
      throw new AppError('Já existe uma conta cadastrada com este e-mail.', 409, 'EMAIL_ALREADY_EXISTS');
    }

    if (type === 'PASSWORD_RESET' && !existing) {
      throw new AppError('Não encontramos nenhuma conta cadastrada com este e-mail.', 404, 'USER_NOT_FOUND');
    }

    // Generate 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove any previous codes for this email and type
    await prisma.emailVerification.deleteMany({
      where: { email: validEmail, type },
    });

    await prisma.emailVerification.create({
      data: {
        email: validEmail,
        code,
        type,
        expiresAt,
      },
    });

    await sendVerificationEmail(validEmail, code, type);

    return {
      email: validEmail,
      type,
      expiresInMinutes: 10,
    };
  }

  async registerWithCode(input: RegisterInput & { code: string }) {
    const validEmail = await validateRealEmail(input.email);

    // Verify code
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: validEmail,
        code: input.code.trim(),
        type: 'REGISTER',
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new AppError('Código de verificação incorreto ou expirado. Solicite um novo código.', 400, 'INVALID_VERIFICATION_CODE');
    }

    // Delete verification record
    await prisma.emailVerification.deleteMany({
      where: { email: validEmail, type: 'REGISTER' },
    });

    const existing = await prisma.user.findUnique({
      where: { email: validEmail },
    });

    if (existing) {
      throw new AppError('Já existe uma conta cadastrada com este e-mail.', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: validEmail,
        passwordHash,
      },
    });

    // Create initial personal workspace (use first name only to avoid overflow)
    const firstName = input.name.trim().split(/\s+/)[0] || 'Meu';
    const baseSlug = firstName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'workspace';
    const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: `${firstName}'s Workspace`,
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

  async resetPassword(input: { email: string; code: string; newPassword: string }) {
    const validEmail = await validateRealEmail(input.email);

    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: validEmail,
        code: input.code.trim(),
        type: 'PASSWORD_RESET',
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new AppError('Código de recuperação incorreto ou expirado. Solicite um novo código.', 400, 'INVALID_RESET_CODE');
    }

    const user = await prisma.user.findUnique({
      where: { email: validEmail },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.emailVerification.deleteMany({
      where: { email: validEmail, type: 'PASSWORD_RESET' },
    });

    return { success: true };
  }

  async register(input: RegisterInput) {
    const validEmail = await validateRealEmail(input.email);
    const existing = await prisma.user.findUnique({
      where: { email: validEmail },
    });

    if (existing) {
      throw new AppError('Já existe uma conta cadastrada com este e-mail.', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: validEmail,
        passwordHash,
      },
    });

    const firstName = input.name.trim().split(/\s+/)[0] || 'Meu';
    const baseSlug = firstName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) || 'workspace';
    const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: `${firstName}'s Workspace`,
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
    const validEmail = input.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: validEmail },
    });

    if (!user) {
      throw new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS');
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
