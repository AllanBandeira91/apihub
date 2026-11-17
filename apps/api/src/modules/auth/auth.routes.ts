import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LoginInputSchema, RegisterInputSchema } from '@apihub/shared';
import { authService } from './auth.service';
import { authenticate } from '../../middleware/auth';

const SendVerificationSchema = z.object({
  email: z.string().email('Formato de e-mail inválido'),
  type: z.enum(['REGISTER', 'PASSWORD_RESET']).default('REGISTER'),
});

const RegisterWithCodeSchema = RegisterInputSchema.extend({
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
});

const ResetPasswordSchema = z.object({
  email: z.string().email('Formato de e-mail inválido'),
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
  newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/send-verification', async (request, reply) => {
    const input = SendVerificationSchema.parse(request.body);
    const result = await authService.sendVerificationCode(input.email, input.type);

    return reply.send({
      success: true,
      data: result,
    });
  });

  app.post('/register-with-code', async (request, reply) => {
    const input = RegisterWithCodeSchema.parse(request.body);
    const result = await authService.registerWithCode(input);

    const token = app.jwt.sign({ id: result.user.id, email: result.user.email });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return reply.status(201).send({
      success: true,
      data: {
        ...result,
        token,
      },
    });
  });

  app.post('/reset-password', async (request, reply) => {
    const input = ResetPasswordSchema.parse(request.body);
    await authService.resetPassword(input);

    return reply.send({
      success: true,
      data: { message: 'Senha alterada com sucesso! Você já pode fazer login.' },
    });
  });

  app.post('/register', async (request, reply) => {
    const input = RegisterInputSchema.parse(request.body);
    const result = await authService.register(input);

    const token = app.jwt.sign({ id: result.user.id, email: result.user.email });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return reply.status(201).send({
      success: true,
      data: {
        ...result,
        token,
      },
    });
  });

  app.post('/login', async (request, reply) => {
    const input = LoginInputSchema.parse(request.body);
    const user = await authService.login(input);

    const token = app.jwt.sign({ id: user.id, email: user.email });

    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return reply.send({
      success: true,
      data: {
        user,
        token,
      },
    });
  });

  app.post('/logout', async (request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getMe(request.user!.id);
    return reply.send({
      success: true,
      data: { user },
    });
  });
}
