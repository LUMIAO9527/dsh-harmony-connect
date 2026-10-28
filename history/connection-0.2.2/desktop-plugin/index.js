import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MobileAccessGateway, JsonDeviceStore, parseGatewayConfig, originGatewayConfig } from 'dsh-mobile';

export const name = 'dsh-harmony-connect';
export const inject = ['webServer', 'connection'];
const ADMIN = '/api/mobile-access/harmony';
const root = dirname(fileURLToPath(import.meta.url));

export async function apply(ctx, config = {}) {
  if (!config.publicOrigin || !isAbsolute(config.stateDirectory || '')) {
    ctx.logger(name).info('Configure publicOrigin and stateDirectory to enable pairing.');
    return;
  }
  const stateFile = join(config.stateDirectory, 'devices.json');
  const template = parseGatewayConfig({
    listenHost: '127.0.0.1', listenPort: 0,
    upstreamOrigin: ctx.webServer.getOrigin(), stateFile,
    tls: { mode: 'disabled' }, pairingTtlMs: 600000,
    deviceTtlMs: 90 * 86400000, sessionTtlMs: 8 * 3600000,
    maxDevices: 20, maxSessions: 40
  });
  const resolved = originGatewayConfig(template, {
    publicOrigin: config.publicOrigin,
    listenHost: '127.0.0.1', listenPort: config.listenPort || 3446,
    allowedCidrs: ['127.0.0.0/8']
  }, stateFile, template.instanceId);
  const upstream = ctx.connection.authenticatedUrl(template.upstreamOrigin.origin);
  const bootstrap = await readFile(join(root, 'gateway-bootstrap.js'), 'utf8');
  const gateway = new MobileAccessGateway(resolved, new JsonDeviceStore(stateFile, resolved.maxDevices), undefined, upstream);
  await gateway.start();
  // Cordis 4 awaits effect cleanup before reapplying a plugin context.
  ctx.effect(() => () => gateway.close(), 'harmony gateway lifetime');
  ctx.on('webserver/index-inject', table => {
    table.push({ kind: 'script', placement: 'head', text: bootstrap });
  });
  const admin = gateway.localAdminRoute(ADMIN, request => ctx.connection.requestRejection(request) === undefined);
  ctx.effect(() => ctx.webServer.register({
    ...admin,
    handler: async (request, response) => {
      // This control surface stays behind DSH authentication as well as the gateway's loopback checks.
      if (ctx.connection.requestRejection(request) !== undefined) {
        response.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        response.end('{"error":"authentication_required"}');
        return;
      }
      await admin.handler(request, response);
    }
  }), 'harmony pairing control');
  // A non-secret endpoint makes installation and the selected frontend observable.
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: ADMIN + '/connector',
    handler: (request, response) => {
      if (ctx.connection.requestRejection(request) !== undefined) { response.writeHead(401); response.end(); return; }
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ version: '0.2.1-preview.1', frontend: 'stock', origin: gateway.address().origin }));
    }
  }), 'harmony connector status');
  ctx.logger(name).info('Pairing gateway ready on loopback port %d; device lifetime 90 days.', gateway.address().port);
}
