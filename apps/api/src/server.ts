import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { errorHandler } from './plugins/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { workspacesRoutes } from './modules/workspaces/workspaces.routes';
import { projectsRoutes } from './modules/projects/projects.routes';
import { apisRoutes } from './modules/apis/apis.routes';
import { testerRoutes } from './modules/tester/tester.routes';
import { keysRoutes } from './modules/keys/keys.routes';
import { environmentsRoutes } from './modules/environments/environments.routes';
import { monitorsRoutes } from './modules/monitors/monitors.routes';
import { startMonitorScheduler } from './modules/monitors/monitors.service';

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : {
      level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    },
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  // Plugins
  app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.register(cookie, {
    secret: env.COOKIE_SECRET,
  });

  app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  // Centralized Error Handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'apihub-api',
      version: '1.0.0',
    };
  });

  // API v1 Routes
  app.register(async v1 => {
    v1.register(authRoutes, { prefix: '/auth' });
    v1.register(workspacesRoutes, { prefix: '/workspaces' });
    v1.register(projectsRoutes);
    v1.register(apisRoutes);
    v1.register(testerRoutes);
    v1.register(keysRoutes);
    v1.register(environmentsRoutes);
    v1.register(monitorsRoutes);
  }, { prefix: '/api/v1' });

  return app;
}

export async function startServer() {
  const app = buildApp();
  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`CloudAPI Backend is running at ${address}`);
    startMonitorScheduler();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  startServer();
}
