import { describe, it, expect } from 'vitest';
import { testerService } from '../src/modules/tester/tester.service';

describe('API Tester Security - SSRF Protection', () => {
  it('blocks loopback address 127.0.0.1', async () => {
    await expect(
      testerService.validateUrlSecurity('http://127.0.0.1:8080/admin')
    ).rejects.toThrow(/blocked for security reasons/i);
  });

  it('blocks localhost hostname', async () => {
    await expect(
      testerService.validateUrlSecurity('http://localhost:3000/api')
    ).rejects.toThrow(/blocked for security reasons/i);
  });

  it('blocks private class A range (10.0.0.1)', async () => {
    await expect(
      testerService.validateUrlSecurity('http://10.0.0.1/status')
    ).rejects.toThrow(/blocked for security reasons/i);
  });

  it('blocks private class C range (192.168.1.1)', async () => {
    await expect(
      testerService.validateUrlSecurity('http://192.168.1.1/router')
    ).rejects.toThrow(/blocked for security reasons/i);
  });

  it('blocks AWS/GCP cloud metadata IP (169.254.169.254)', async () => {
    await expect(
      testerService.validateUrlSecurity('http://169.254.169.254/latest/meta-data/')
    ).rejects.toThrow(/blocked for security reasons/i);
  });

  it('blocks unsupported protocols like file://, ftp://, gopher://', async () => {
    await expect(
      testerService.validateUrlSecurity('file:///etc/passwd')
    ).rejects.toThrow(/Only HTTP and HTTPS/i);

    await expect(
      testerService.validateUrlSecurity('ftp://example.com/files')
    ).rejects.toThrow(/Only HTTP and HTTPS/i);
  });

  it('accepts public safe domains (e.g. https://httpbin.org/get)', async () => {
    const url = await testerService.validateUrlSecurity('https://httpbin.org/get');
    expect(url).toBe('https://httpbin.org/get');
  });
});
