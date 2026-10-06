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
