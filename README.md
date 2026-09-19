# PWA Test

Small installable web app for Chrome on your phone.

## Files

- `index.html`
- `manifest.json`
- `sw.js`
- `icon-192.png`
- `icon-512.png`

## Put it on GitHub Pages

1. Create a new GitHub repo named `pwa-test`.
2. From this folder:

```bash
git add index.html manifest.json sw.js icon-192.png icon-512.png .gitignore
git commit -m "Add installable PWA test app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pwa-test.git
git push -u origin main
```

3. On GitHub: **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
4. Open `https://YOUR_USERNAME.github.io/pwa-test/` on your phone in **Chrome**.
5. Wait a few seconds, then tap **Install app**, or Chrome menu → **Install app** / **Add to Home screen**.

Use HTTPS. Chrome will not offer install on a plain HTTP site (except localhost).
