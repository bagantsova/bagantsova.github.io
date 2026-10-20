# bagantsova.github.io

Public contact card — one link to share instead of pasting email, LinkedIn and GitHub
separately.

**Live at:** https://bagantsova.github.io/

## Editing

Everything is in [`index.html`](index.html): one file, no build step, no dependencies,
no external requests. Push to `main` and GitHub Pages redeploys within a minute or two.

To add a link, copy one of the `<a class="link">` blocks inside `<nav class="links">`
and swap the `href`, the icon `<svg>` path, the `.label` and the `.sub` line.

The page follows the visitor's system light/dark setting; colors are the CSS variables
on `:root` at the top of the file.

## Private contacts

Phone, WhatsApp, Telegram and Instagram are **not** on this page. They live on a
separate card on Cloudflare Workers (`~/contact-card`), which hands out one QR code
per person and can expire or revoke them individually.

To show a pointer to it here, set `CARD_URL` near the bottom of `index.html` to the
deployed address and push:

```js
var CARD_URL = 'https://contact-card.<subdomain>.workers.dev';
```

While it is empty the row stays hidden, so publishing with no URL set is harmless.

### Why they moved

This page used to carry the private links as an encrypted blob that the browser
decrypted with a shared passphrase. The cryptography was sound, but two limits came
with being a static file:

- **One passphrase for everybody.** No way to tell whose copy had travelled, and
  revoking meant reprinting every QR code.
- **Published ciphertext is permanent.** Anyone could archive the blob and keep it;
  changing the passphrase did not un-publish what was already out.

A server-side check fixes both: the links are never sent unless a valid, unexpired,
unrevoked token arrives with the request.

> The old ciphertext remains in this repository's git history, and it still decrypts
> with the passphrase it was published under. Since the phone number behind it has not
> changed, treat that number as having been published — removing it from the live page
> does not retract it.
