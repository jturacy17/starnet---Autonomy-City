# Render: private Phase 1 trial

Deploy the `phase-1/enterprise-control` branch as a Node Web Service.

- Root directory: blank
- Build command: `ONNXRUNTIME_NODE_INSTALL=skip ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci`
- Start command: `node scripts/start-hosted.js`
- Health check path: `/healthz`
- Node version: set `NODE_VERSION` to `24.19.0` (the validated development runtime).
- Set `STARNET_HOST_USER` to your chosen login name (no colon).
- Set `STARNET_HOST_PASSWORD` securely in Render to a unique random password of at least 16 characters. Never commit it or send it in chat.
- Render supplies `PORT` and `RENDER_EXTERNAL_URL`; do not override them. The service must be accessed via that exact Render hostname.

The browser will prompt for the username and password. The hosted gateway authenticates every UI and API request except `/healthz`, checks the public Host and Origin, and forwards to the original loopback sidecar. It retains the application's token and scoped ticket controls. Health probes only report readiness. The sidecar remains on port 8787 internally; the gateway listens on Render's assigned port on all interfaces. Do not use `npm start` for hosting: that starts only the local sidecar.

Free instances have no persistent disk and sleep when idle. This configuration is a trial for reviewing the city. It defaults to `/tmp/autonomy-city/workspaces`; state is not durable across replacement/redeployment. Do not rely on it for business records or background operations. Do not enable development/full-access flags. No live AI provider execution or OAuth login flow has been certified for this hosted trial.

A durable installation needs a persistent disk and `STARNET_WORKSPACES` pointing to a directory on that disk. Cost and production configuration require a separate decision. Autonomous publishing remains locked.

Validation:

```sh
node --test test/hosted-proxy.test.js test/enterprise-*.test.js test/autonomy-city-surface.test.js
```

Before deployment, the hosted entry point was started locally, unauthenticated pages returned 401, `/healthz` reported readiness, and an authenticated Chromium session exercised the live Command API, Media and Sports panels. Render-specific resource limits and actual public TLS routing still require checking deployment logs and the deployed URL.

## Connect a chat provider

From StarNet's Connect a brain screen, choose OpenAI. Pick one connection method:

1. API key: create a project API key at https://platform.openai.com/api-keys with API billing enabled. Enter it directly into the app's API KEY field, choose an available model, and press WAKE OVERSEER. The app checks the connection before proceeding. API usage is billed separately from a ChatGPT subscription. Never paste the key into chat or a screenshot. For a key supplied through Render instead, the application reads `OPENAI_API_KEY` from its process environment; enter the secret in Render's Environment settings.
2. ChatGPT sign-in: leave the key field empty, click SIGN IN WITH CHATGPT, and follow the app's device-code flow on the official `auth.openai.com` page. Return to the app when it reports connected, choose a listed model and press WAKE OVERSEER. This project uses the Codex device-auth integration; actual account eligibility and this hosted sign-in have not been verified. Do not assume successful provider execution until the app's connection check passes.

Provider access does not import this ChatGPT conversation. Free Render storage may lose saved agent state and sign-in sessions after instance replacement. The campus map can be viewed without connecting a provider.
