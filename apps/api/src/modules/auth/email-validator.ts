import dns from 'dns';
import { AppError } from '../../plugins/errorHandler';

// Known temporary/disposable email domains blocklist
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'tempmail.com',
  'temp-mail.org',
  'mailinator.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'fakeinbox.com',
  'dispostable.com',
  'trashmail.com',
  'trashmail.net',
  'getnada.com',
  'mohmal.com',
  'sharklasers.com',
  'generator.email',
  'emailfake.com',
  'burnermail.io',
  'dropmail.me',
  'inboxkitten.com',
]);

export async function validateRealEmail(email: string): Promise<string> {
  const cleaned = email.trim().toLowerCase();

  // 1. Basic format / RFC regex validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleaned)) {
    throw new AppError('Formato de e-mail inválido.', 400, 'INVALID_EMAIL_FORMAT');
  }

  const parts = cleaned.split('@');
  if (parts.length !== 2) {
    throw new AppError('Formato de e-mail inválido.', 400, 'INVALID_EMAIL_FORMAT');
  }

  const domain = parts[1];

  // 2. Disposable / temporary email block
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw new AppError(
      'E-mails temporários ou descartáveis não são permitidos. Por favor, utilize um e-mail real e válido.',
      400,
      'DISPOSABLE_EMAIL_NOT_ALLOWED'
    );
  }

  // 3. Real DNS MX Record Lookup (checks if the domain actually has active mail servers)
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new AppError(
        `O domínio "${domain}" não possui servidores de e-mail (registro MX) configurados para receber mensagens.`,
        400,
        'NO_MX_RECORDS'
      );
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    if (err.code === 'ENOTFOUND' || err.code === 'NODATA' || err.code === 'NXDOMAIN') {
      throw new AppError(
        `O domínio "${domain}" não existe ou não possui servidores de e-mail configurados. Por favor, verifique a digitação.`,
        400,
        'DOMAIN_NOT_FOUND'
      );
    }
    // If DNS query times out or local network lacks external DNS, fail open only if domain has a dot
    if (!domain.includes('.')) {
      throw new AppError('Domínio de e-mail inválido.', 400, 'INVALID_DOMAIN');
    }
  }

  return cleaned;
}
