# Deploying CarHawk to Google Sheets (clasp)

One-time setup, then every update is a single command — no more copy-pasting
files into the Apps Script editor.

## One-time setup (on your computer)

1. **Install Node.js** if you don't have it: https://nodejs.org (LTS is fine).

2. **Install clasp** (Google's Apps Script CLI):
   ```
   npm install -g @google/clasp
   ```

3. **Log in with your Google account** (the one that owns the CarHawk sheet):
   ```
   clasp login
   ```
   A browser window opens — approve access.

4. **Enable the Apps Script API** (required once per account):
   https://script.google.com/home/usersettings → turn ON "Google Apps Script API".

5. **Set your Script ID.** In the CarHawk spreadsheet:
   Extensions → Apps Script → ⚙️ Project Settings → copy the **Script ID**.
   Open `.clasp.json` in this repo and replace `YOUR_SCRIPT_ID_HERE` with it.

## Every update after that

From the repo folder:
```
clasp push
```
That uploads every `.gs` and `.html` file to the bound Apps Script project.
Reload the spreadsheet (F5) and the CarHawk menu picks up the new code.

Useful extras:
```
clasp push --watch   # auto-push on every file save
clasp open           # open the Apps Script editor in your browser
clasp pull           # pull down edits made directly in the online editor
```

## Notes

- `.clasp.json` controls push order (`filePushOrder`) so `quantum_config.gs`
  loads first. Don't remove it from the list.
- `appsscript.json` (the manifest) is pushed too — keep it in the repo root.
- If `clasp push` says "Manifest file has been updated. Do you want to push and
  overwrite?", answer **yes**.
- clasp respects `.claspignore` if you ever want to exclude files
  (e.g. `main.gs.backup-v2.0.0` — see below).
