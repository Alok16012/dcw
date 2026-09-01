/**
 * Integration layer.
 *
 * Every outbound dependency (CRM, OTP, WhatsApp) sits behind a driver interface.
 * The `demo` driver is in-process, deterministic and side-effect free — nothing
 * leaves the machine. Setting DCW_INTEGRATION_DRIVER=live selects the real
 * adapters once credentials exist; until then `live` deliberately throws rather
 * than silently degrading to demo behaviour.
 */
export const DRIVER = process.env.DCW_INTEGRATION_DRIVER || 'demo';
export const isDemo = DRIVER === 'demo';

export function requireLiveConfig(name, vars) {
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length) {
    throw new Error(`${name}: live driver selected but missing env: ${missing.join(', ')}`);
  }
}
