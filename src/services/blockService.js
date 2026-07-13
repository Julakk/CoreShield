const config = require('../config');
const logger = require('../utils/logger');
const { safeExec } = require('../utils/safeExec');
const { isValidIp, isBlockableIp } = require('../utils/validators');
const { AppError } = require('../middleware/errorHandler');

/**
 * Block via CrowdSec's local bouncer/LAPI (preferred — no root shell needed,
 * and CrowdSec already handles decision expiry, dedup, etc.)
 */
async function blockViaCrowdSec(ip, { duration = '4h', reason = 'manual block via CoreShield' } = {}) {
  const res = await fetch(`${config.crowdsec.apiUrl}/v1/decisions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': config.crowdsec.apiKey,
    },
    body: JSON.stringify([
      {
        type: 'ban',
        origin: 'coreshield',
        scope: 'Ip',
        value: ip,
        duration,
        reason,
      },
    ]),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AppError(`CrowdSec API error (${res.status}): ${text}`, 502);
  }
  return { method: 'crowdsec', ip, duration, reason };
}

/**
 * Block via iptables. Only used if BLOCK_METHOD=iptables.
 *
 * Rather than calling `iptables` directly as root, this calls a single,
 * narrowly-scoped shell script (scripts/manage_firewall.sh) via sudo. The
 * script does its own strict IP validation and only ever invokes
 * iptables/ip6tables with a fixed, small set of flags — see the sudoers
 * config in scripts/coreshield-sudoers.example for why this bounds the
 * blast radius even if the Node process itself were compromised.
 *
 * Uses execFile with an argument array throughout — ip is never
 * concatenated into a shell string, so it cannot break out of the
 * argument regardless of content. This is defense-in-depth on top of the
 * script's own validation, not a substitute for it.
 */
async function blockViaIptables(ip) {
  await safeExec(config.firewall.sudoBin, [
    config.firewall.scriptPath,
    'block',
    ip,
  ]);
  return { method: 'iptables', ip };
}

async function blockIp(ip, options = {}) {
  if (!isValidIp(ip)) {
    throw new AppError(`Invalid IP address format: ${ip}`, 400);
  }
  if (!isBlockableIp(ip)) {
    throw new AppError(`Refusing to block private/reserved IP: ${ip}`, 400);
  }

  const result =
    config.blockMethod === 'iptables'
      ? await blockViaIptables(ip)
      : await blockViaCrowdSec(ip, options);

  logger.info('IP blocked', { ...result, actor: options.actor });
  return result;
}

async function unblockIp(ip) {
  if (!isValidIp(ip)) {
    throw new AppError(`Invalid IP address format: ${ip}`, 400);
  }

  if (config.blockMethod === 'iptables') {
    await safeExec(config.firewall.sudoBin, [
      config.firewall.scriptPath,
      'unblock',
      ip,
    ]);
    logger.info('IP unblocked via iptables', { ip });
    return { method: 'iptables', ip, unblocked: true };
  }

  const res = await fetch(
    `${config.crowdsec.apiUrl}/v1/decisions?ip=${encodeURIComponent(ip)}`,
    {
      method: 'DELETE',
      headers: { 'X-Api-Key': config.crowdsec.apiKey },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AppError(`CrowdSec API error (${res.status}): ${text}`, 502);
  }
  logger.info('IP unblocked via CrowdSec', { ip });
  return { method: 'crowdsec', ip, unblocked: true };
}

module.exports = { blockIp, unblockIp };
