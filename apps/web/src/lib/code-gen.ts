export interface CodeGenInput {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, "'\\''");
}

export function generateCurl(input: CodeGenInput): string {
  const method = (input.method || 'GET').toUpperCase();
  const url = input.url?.trim() || 'https://api.exemplo.com/v1/recurso';
  const lines: string[] = [`curl -X ${method} '${escapeSingleQuotes(url)}'`];

  const headers = input.headers || {};
  for (const [key, value] of Object.entries(headers)) {
    const k = key.replace(/[\r\n\0]/g, '').trim();
    const v = value.replace(/[\r\n\0]/g, '').trim();
    if (k) {
      lines.push(`  -H '${escapeSingleQuotes(k)}: ${escapeSingleQuotes(v)}'`);
    }
  }

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method) && input.body?.trim();
  if (hasBody) {
    if (!Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) {
      lines.push(`  -H 'Content-Type: application/json'`);
    }
    lines.push(`  -d '${escapeSingleQuotes(input.body!.trim())}'`);
  }

  return lines.join(' \\\n');
}

export function generateFetch(input: CodeGenInput): string {
  const method = (input.method || 'GET').toUpperCase();
  const url = input.url?.trim() || 'https://api.exemplo.com/v1/recurso';
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(input.headers || {})) {
    const k = key.replace(/[\r\n\0]/g, '').trim();
    const v = value.replace(/[\r\n\0]/g, '').trim();
    if (k) headers[k] = v;
  }

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method) && input.body?.trim();
  if (hasBody && !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  const optionsLines: string[] = [`  method: ${JSON.stringify(method)},`];
  if (Object.keys(headers).length > 0) {
    optionsLines.push(
      `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},`
    );
  }
  if (hasBody) {
    try {
      const parsed = JSON.parse(input.body!.trim());
      optionsLines.push(
        `  body: JSON.stringify(${JSON.stringify(parsed, null, 4).replace(/\n/g, '\n  ')}),`
      );
    } catch {
      optionsLines.push(`  body: ${JSON.stringify(input.body!.trim())},`);
    }
  }

  return `const response = await fetch(${JSON.stringify(url)}, {\n${optionsLines.join('\n')}\n});\n\nconst data = await response.json();\n`;
}

export function generatePython(input: CodeGenInput): string {
  const method = (input.method || 'GET').toLowerCase();
  const url = input.url?.trim() || 'https://api.exemplo.com/v1/recurso';
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(input.headers || {})) {
    const k = key.replace(/[\r\n\0]/g, '').trim();
    const v = value.replace(/[\r\n\0]/g, '').trim();
    if (k) headers[k] = v;
  }

  const lines: string[] = ['import requests', '', `url = ${JSON.stringify(url)}`];
  const args: string[] = ['url'];

  if (Object.keys(headers).length > 0) {
    lines.push(`headers = ${JSON.stringify(headers, null, 2)}`);
    args.push('headers=headers');
  }

  const hasBody = ['post', 'put', 'patch'].includes(method) && input.body?.trim();
  if (hasBody) {
    try {
      const parsed = JSON.parse(input.body!.trim());
      lines.push(`payload = ${JSON.stringify(parsed, null, 2)}`);
      args.push('json=payload');
    } catch {
      lines.push(`payload = ${JSON.stringify(input.body!.trim())}`);
      args.push('data=payload');
    }
  }

  lines.push('');
  lines.push(`response = requests.${method}(${args.join(', ')}, timeout=10)`);
  lines.push('print(response.status_code, response.text)');
  return lines.join('\n');
}
