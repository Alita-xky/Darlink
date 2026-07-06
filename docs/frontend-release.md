# Frontend Release Rule

Use one release id for the whole app shell.

When deploying frontend changes, update these values together:

- `frontend/app.html` meta `darlink-release-id`
- `frontend/app.html` query strings for `/prototype-engine.js` and `/flow-router.js`
- `frontend/flow-router.js` `PAGE_ASSET_VERSION`

Do not deploy feature-specific mixed versions such as one id for `prototype-engine.js` and another id for `flow-router.js`. The app shell, router, page templates, and runtime enhancer are coupled through iframe loading and browser cache keys.

Current release: `20260704-restore-2-final`


## Entry points

- Product shell: `/app.html` only
- Marketing: `/landing-v14.html`
- Do not use removed `frontend/dist` or duplicate `frontend/code.html`
- Stale copies archived under `Darlink-local-backups/frontend-stale-20260705/`
