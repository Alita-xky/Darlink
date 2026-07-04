# Darlink frontend

This folder is the current deployable static frontend for Darlink.

- `landing-v14.html` is the pre-entry UI.
- `app.html` is the connected App Flow shell.
- `pages/*/code.html` contains the screen source files.
- `flow-router.js` connects the static screens into the product flow.
- `onboarding-config.js` is the **single source of truth** for onboarding questions/UI (edit this file; do not overwrite on remote sync).
- `prototype-engine.js` enhances onboarding, login, Xiaoda chat, and app navigation.
- `questionnaire-data.js` contains mode-specific questionnaire data.
- `vercel.json` rewrites `/`, `/v14`, and `/app` to the correct static entry points.

## Protected local files

When syncing from GitHub remote, **keep these files**:

- `onboarding-config.js`
- Local changes in `prototype-engine.js` (onboarding/login sections)
- `app.html` script tags must load `onboarding-config.js` before `prototype-engine.js`

Open locally from this folder with any static file server:

```bash
python3 -m http.server 54114
```

Then open:

`http://127.0.0.1:54114/landing-v14.html`
