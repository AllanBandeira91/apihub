import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { AppError } from '../../plugins/errorHandler';

function createTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new AppError(
      'Serviço de envio de e-mail (SMTP) não configurado. Defina a Senha de App (SMTP_PASS) do e-mail apihubsupport@gmail.com no arquivo .env para disparar códigos reais.',
      503,
      'SMTP_NOT_CONFIGURED'
    );
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
  });
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  type: 'REGISTER' | 'PASSWORD_RESET'
): Promise<void> {
  // Prevent CRLF / email header injection
  const sanitizedTo = to.replace(/[\r\n\0]/g, '').trim();
  const sanitizedCode = code.replace(/[^0-9]/g, '');

  const transporter = createTransporter();

  const isReset = type === 'PASSWORD_RESET';
  const subject = isReset
    ? 'CloudAPI — Código para Recuperação de Senha'
    : 'CloudAPI — Código de Verificação da sua Conta';

  const heading = isReset
    ? 'Redefinição de Senha'
    : 'Confirme seu E-mail no CloudAPI';

  const description = isReset
    ? 'Recebemos uma solicitação para alterar a senha da sua conta no CloudAPI. Utilize o código abaixo para continuar:'
    : 'Falta apenas um passo para ativar sua conta no CloudAPI. Digite o código abaixo na tela de cadastro:';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 20px;">
            λ
          </div>
          <h1 style="margin: 16px 0 8px; font-size: 20px; color: #ffffff;">${heading}</h1>
          <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">${description}</p>
        </div>

        <div style="background-color: #09090b; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #60a5fa;">
            ${sanitizedCode}
          </span>
        </div>

        <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0;">
          Este código expira em <strong>10 minutos</strong>. Se você não solicitou este e-mail, pode ignorá-lo com segurança.
        </p>

        <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />

        <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
          CloudAPI • Plataforma de Gestão de APIs • Suporte: apihubsupport@gmail.com
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: sanitizedTo,
      subject,
      text: `${heading}\n\n${description}\n\nCódigo: ${sanitizedCode}\n\nExpira em 10 minutos.`,
      html,
    });
  } catch (err: any) {
    throw new AppError(
      'Não foi possível enviar o e-mail de verificação. Verifique as credenciais SMTP ou tente novamente em instantes.',
      502,
      'EMAIL_DELIVERY_FAILED'
    );
  }
}

export async function sendWorkspaceInviteEmail(
  to: string,
  inviterName: string,
  workspaceName: string,
  role: string,
  alreadyRegistered: boolean
): Promise<void> {
  const sanitizedTo = to.replace(/[\r\n\0]/g, '').trim();
  const transporter = createTransporter();

  const subject = `CloudAPI — ${inviterName} convidou você para o workspace "${workspaceName}"`;
  const actionText = alreadyRegistered
    ? 'Você já foi adicionado ao workspace com sucesso! Basta acessar sua conta no CloudAPI para colaborar.'
    : 'Crie sua conta gratuita no CloudAPI usando este mesmo e-mail para começar a colaborar com a equipe.';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 20px;">
            λ
          </div>
          <h1 style="margin: 16px 0 8px; font-size: 20px; color: #ffffff;">Convite para Workspace</h1>
          <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
            <strong>${inviterName}</strong> convidou você para o workspace <strong>${workspaceName}</strong> com permissão de <strong>${role}</strong>.
          </p>
        </div>

        <p style="font-size: 13px; color: #d4d4d8; text-align: center; line-height: 1.6; margin: 20px 0;">
          ${actionText}
        </p>

        <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />

        <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
          CloudAPI • Plataforma de Gestão de APIs • Suporte: apihubsupport@gmail.com
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: sanitizedTo,
      subject,
      text: `${inviterName} convidou você para o workspace "${workspaceName}" (${role}). ${actionText}`,
      html,
    });
  } catch {
    // Non-fatal if invite email fails when user is already added to workspace
  }
}

export async function sendUptimeAlertEmail(params: {
  to: string;
  monitorName: string;
  url: string;
  status: 'UP' | 'DOWN';
  statusCode: number;
  latencyMs: number;
  error?: string | null;
}): Promise<void> {
  const sanitizedTo = params.to.replace(/[\r\n\0]/g, '').trim();
  let transporter;
  try {
    transporter = createTransporter();
  } catch {
    return;
  }

  const isDown = params.status === 'DOWN';
  const subject = isDown
    ? `[ALERTA CRÍTICO] CloudAPI — "${params.monitorName}" está FORA DO AR`
    : `[RECUPERADO] CloudAPI — "${params.monitorName}" voltou ao normal`;

  const badgeColor = isDown ? '#dc2626' : '#16a34a';
  const badgeLabel = isDown ? 'OFFLINE / DOWN' : 'ONLINE / UP';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 32px 16px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; padding: 6px 14px; border-radius: 999px; background-color: ${badgeColor}; color: #ffffff; font-weight: bold; font-size: 12px; letter-spacing: 1px;">
            ${badgeLabel}
          </span>
          <h1 style="margin: 16px 0 6px; font-size: 20px; color: #ffffff;">${params.monitorName}</h1>
          <p style="margin: 0; font-size: 12px; font-family: monospace; color: #a1a1aa; word-break: break-all;">${params.url}</p>
        </div>

        <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; font-size: 13px; color: #d4d4d8;">
          <p style="margin: 4px 0;"><strong>Status HTTP:</strong> ${params.statusCode || 'Sem resposta'}</p>
          <p style="margin: 4px 0;"><strong>Latência:</strong> ${params.latencyMs} ms</p>
          ${params.error ? `<p style="margin: 4px 0; color: #f87171;"><strong>Detalhe:</strong> ${params.error}</p>` : ''}
          <p style="margin: 4px 0;"><strong>Horário (UTC):</strong> ${new Date().toISOString()}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />

        <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
          CloudAPI Monitoramento Automático • Suporte: apihubsupport@gmail.com
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: sanitizedTo,
      subject,
      text: `${badgeLabel} - ${params.monitorName} (${params.url}) | Status: ${params.statusCode} | Latência: ${params.latencyMs}ms ${params.error ? '| Erro: ' + params.error : ''}`,
      html,
    });
  } catch {
    // Avoid throwing from background alert dispatch
  }
}
