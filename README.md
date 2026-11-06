# PWA Test

Small installable web app for Chrome on your phone.

**Live site:** https://lukeanthony-del.github.io/pwa-test/

Home screen name: **Pickle Central**

Open that URL in Chrome on your phone, then Install / Add to Home Screen. After later updates, reopen the app (or visit the same URL) to get the new version.

**Luke Messages:** https://lukeanthony-del.github.io/pwa-test/luke-messages/

Install that page to your home screen. It shows texts, call history, and contacts you import from a backup. Google Messages does not let a website read the inbox directly. On the Android phone that has your messages, export an XML backup with SMS Backup & Restore (messages and, if you want them, call logs), plus a contacts CSV or vCard. Sending a text opens your phone’s messaging app so it goes out on your number. Calling opens the phone dialer. Everything you import stays in the browser on that device.

**Shorts feed:** https://lukeanthony-del.github.io/pwa-test/tiktok-app/

Install that page to your home screen. It opens on one Short. On the Friends tab, add Simon Devera and confirm with the phone's fingerprint to unlock a feed that keeps loading YouTube Shorts. Closing the app locks that feed again. If a previously installed copy still shows a black screen, open the page once more so the updated app can replace it.

Repo: https://github.com/LukeAnthony-Del/pwa-test

## Export apps

- **Export Connect:** https://lukeanthony-del.github.io/pwa-test/export-connect/
- **Export Hub:** https://lukeanthony-del.github.io/pwa-test/export-hub/

Export Connect is an installable PWA that lets each person explicitly select the
photos and videos they want to upload. Export Hub is an administrator-only
gallery with five-column media grids and ZIP downloads. Files are private in
Supabase; ntfy.sh carries only a generic new-upload alert.

### One-time setup

1. Create a Supabase project.
2. Run `export-supabase.sql` in its SQL editor.
3. Enable anonymous sign-ins under Authentication → Providers.
4. Create the Hub email/password user under Authentication → Users.
5. Run the admin `update auth.users` statement shown at the top of
   `export-supabase.sql`, using that email.
6. Put the project URL and anon key in `export-config.js`.
7. Replace the ntfy topic in `export-config.js` with a long random value.

The profile photo is mandatory. Other media is selected through the device's
system picker; the web app cannot read or upload unselected library items.
