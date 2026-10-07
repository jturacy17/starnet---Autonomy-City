'use strict';
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createHostedProxy } = require('../sidecar/hosted-proxy');
const port = Number(process.env.PORT || 10000);
const upstreamPort = 8787;
if (!Number.isInteger(port) || port < 1 || port > 65535 || port === upstreamPort) throw new Error('Invalid public PORT');
const server = createHostedProxy({ origin:process.env.RENDER_EXTERNAL_URL || process.env.STARNET_HOST_ORIGIN, username:process.env.STARNET_HOST_USER, password:process.env.STARNET_HOST_PASSWORD, upstreamPort });
const env = { ...process.env, STARNET_PORT:String(upstreamPort), SKYNET_PORT:String(upstreamPort), STARNET_WORKSPACES:process.env.STARNET_WORKSPACES || '/tmp/autonomy-city/workspaces' };
// The hosted entry point never enables development consent bypasses.
delete env.SKYNET_FULL_ACCESS; delete env.STARNET_FULL_ACCESS;
const child = spawn(process.execPath, [path.resolve(__dirname,'../sidecar/index.js')], { env, stdio:'inherit' });
let stopping = false;
function stop(code) { if (stopping) return; stopping = true; child.kill('SIGTERM'); server.close(() => process.exit(code)); setTimeout(() => process.exit(code), 5000).unref(); }
child.on('error', () => stop(1));
child.on('exit', code => stop(code || 1));
server.on('error', () => stop(1));
process.on('SIGTERM', () => stop(0)); process.on('SIGINT', () => stop(0));
server.listen(port, '0.0.0.0', () => console.log('Hosted gateway listening on port ' + port));
