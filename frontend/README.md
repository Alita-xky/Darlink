# Darlink frontend

This folder is the current deployable static frontend for Darlink.

- `landing-v14.html` is the pre-entry UI.
- `app.html` is the connected App Flow shell.
- `pages/*/code.html` contains the screen source files.
- `flow-router.js` connects the static screens into the product flow.
- `prototype-engine.js` enhances onboarding, login, Xiaoda chat, and app navigation.
- `questionnaire-data.js` contains the current Xiaoda questionnaire data.
- `vercel.json` rewrites `/`, `/v14`, and `/app` to the correct static entry points.

Open locally from this folder with any static file server:

```bash
python3 -m http.server 54088
```

Then open:

`http://127.0.0.1:54088/landing-v14.html`
