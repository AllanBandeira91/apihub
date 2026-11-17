import { FastifyInstance } from 'fastify';
import { LoginInputSchema, RegisterInputSchema } from '@apihub/shared';
import { authService } from './auth.service';
import { authenticate } from '../../middleware/auth';

export async function authRoutes(app: FastifyInstance) {
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
