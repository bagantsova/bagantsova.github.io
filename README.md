# bagantsova.github.io

Personal contact page — one link to share instead of pasting email, LinkedIn and GitHub separately.

**Live at:** https://bagantsova.github.io/

Public links are visible to everyone. A second set (phone, WhatsApp, Telegram, Instagram)
sits behind a passphrase and appears only after unlocking.

## Editing the public part

Everything is in [`index.html`](index.html): one file, no build step, no dependencies.
Push to `main` and GitHub Pages redeploys within a minute or two.

To add a link, copy one of the `<a class="link">` blocks inside `<nav class="links">`
and swap the `href`, the icon `<svg>` path, the `.label` and the `.sub` line.

The page follows the visitor's system light/dark setting; colors are the CSS
variables on `:root` at the top of the file.

## Editing the private part

GitHub Pages serves static files, so there is no server to check a password.
Instead the private links are **encrypted**: `index.html` carries only ciphertext,
and the browser decrypts it with a key derived from the passphrase
(PBKDF2-SHA256, 600k iterations → AES-256-GCM, all via WebCrypto).
A wrong passphrase fails GCM authentication, so there is nothing to bypass by
reading the page source.

The plaintext and the passphrase live in `private/`, which is **gitignored and must
stay that way**. To change what is behind the lock:

```bash
$EDITOR private/content.json     # edit the links
node tools/lock.mjs              # re-encrypt into index.html
git commit -am "Update private links" && git push
```

`node tools/lock.mjs --qr` also prints the unlock URL.
Node's standard library covers the crypto, so there is nothing to install.

To change the passphrase, edit `private/passphrase.txt`, re-run `tools/lock.mjs`,
and regenerate the QR code — the old one stops working.

## The QR code

The QR encodes `https://bagantsova.github.io/#k=<passphrase>`. The `#fragment` is never
sent to the server, so the passphrase stays in the browser; the page strips it from the
address bar once used and keeps it in `sessionStorage` so a refresh does not re-prompt.

Generate one with any QR tool, or:

```bash
python3 -m venv /tmp/qr && /tmp/qr/bin/pip install segno
/tmp/qr/bin/python -c "import segno;segno.make(open('/dev/stdin').read().strip(),error='m').save('contact-qr.png',scale=12,border=4,dark='#0f172a',light='white')" <<< "$(node tools/lock.mjs --qr | tail -1)"
```

**Never commit a QR image** — it contains the passphrase. `.gitignore` covers `*.qr.png`,
`*.qr.svg` and `qr/`, but a file named something else would slip through.

## Threat model, honestly

The encryption is real: without the passphrase the private links cannot be recovered
from the published page. What it cannot do is stop someone you *gave* the QR to from
passing it on, or screenshotting what they see. It keeps the details off search engines
and away from scrapers, and lets you revoke access by changing the passphrase. It is a
business card you can take back, not a vault.
