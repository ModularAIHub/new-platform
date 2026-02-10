// SSRF protection utility for SuiteGenie
import dns from 'dns/promises';
import net from 'net';

export async function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local')
    ) return false;
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (net.isIP(addr.address)) {
        if (
          addr.address.startsWith('10.') ||
          addr.address.startsWith('192.168.') ||
          addr.address.startsWith('172.') ||
          addr.address.startsWith('127.')
        ) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
