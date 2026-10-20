#!/usr/bin/env node
// Encrypts private/content.json with private/passphrase.txt and writes the
// ciphertext into index.html, between the VAULT markers.
//
// Only the ciphertext is ever committed. The plaintext and the passphrase
// stay in private/, which is gitignored.
//
//   node tools/lock.mjs            # re-encrypt and update index.html
//   node tools/lock.mjs --qr       # also print the unlock URL for the QR code
//
// Crypto: PBKDF2-SHA256 (600k iterations) -> AES-256-GCM. The same parameters
// are hardcoded in the unlock() function in index.html; change them in both
// places or old ciphertext stops decrypting.

import { readFileSync, writeFileSync } from 'node:fs';
import { pbkdf2Sync, randomBytes, createCipheriv } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ITERATIONS = 600000;
const SITE = 'https://bagantsova.github.io/';

const START = '<!-- VAULT:START -->';
const END = '<!-- VAULT:END -->';

const passphrase = readFileSync(join(ROOT, 'private/passphrase.txt'), 'utf8').trim();
if (!passphrase) throw new Error('private/passphrase.txt is empty');

// Parse first so a malformed file fails before we touch index.html.
const plaintext = JSON.stringify(
  JSON.parse(readFileSync(join(ROOT, 'private/content.json'), 'utf8'))
);

const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(passphrase, salt, ITERATIONS, 32, 'sha256');

const cipher = createCipheriv('aes-256-gcm', key, iv);
const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
// WebCrypto expects the GCM tag appended to the ciphertext.
const ct = Buffer.concat([body, cipher.getAuthTag()]);

const vault = {
  v: 1,
  kdf: 'PBKDF2-SHA256',
  iterations: ITERATIONS,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: ct.toString('base64'),
};

const indexPath = join(ROOT, 'index.html');
const html = readFileSync(indexPath, 'utf8');
const from = html.indexOf(START);
const to = html.indexOf(END);
if (from === -1 || to === -1) throw new Error(`markers ${START} / ${END} not found in index.html`);

const block = `${START}
<script type="application/json" id="vault">
${JSON.stringify(vault, null, 2)}
</script>
`;

writeFileSync(indexPath, html.slice(0, from) + block + html.slice(to));

console.log(`locked ${JSON.parse(plaintext).items.length} items into index.html (${ct.length} bytes ciphertext)`);
if (process.argv.includes('--qr')) {
  console.log(`${SITE}#k=${encodeURIComponent(passphrase)}`);
}
