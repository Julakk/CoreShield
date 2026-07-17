const config = require('../config');
const logger = require('../utils/logger');
const { safeExec } = require('../utils/safeExec');
const { isValidIpOrCidr, isBlockableIp } = require('../utils/validators');
const { AppError } = require('../middleware/errorHandler');
const ipBlockStore = require('./ipBlockStore');

function isCidr(value) {
  return value.includes('/');
}

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
        scope: isCidr(ip) ? 'Range' : 'Ip',
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

async function blockViaIptables(ip) {
  await safeExec(config.firewall.sudoBin, [
    config.firewall.scriptPath,
    'block',
    ip,
  ]);
  return { method: 'iptables', ip };
}

async function blockIp(ip, options = {}) {
  if (!isValidIpOrCidr(ip)) {
    throw new AppError(`Invalid IP address or CIDR range: ${ip}`, 400);
  }
  if (!isBlockableIp(ip)) {
    throw new AppError(`Refusing to block private/reserved range: ${ip}`, 400);
  }

  const result =
    config.blockMethod === 'iptables'
      ? await blockViaIptables(ip)
      : await blockViaCrowdSec(ip, options);

  if (config.blockMethod === 'iptables') {
    ipBlockStore.add(ip, { reason: options.reason });
  }

  logger.info('IP blocked', { ...result, actor: options.actor });
  return result;
}

async function unblockIp(ip) {
  if (!isValidIpOrCidr(ip)) {
    throw new AppError(`Invalid IP address or CIDR range: ${ip}`, 400);
  }

  if (config.blockMethod === 'iptables') {
    await safeExec(config.firewall.sudoBin, [
      config.firewall.scriptPath,
      'unblock',
      ip,
    ]);
    ipBlockStore.remove(ip);
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

async function listBlockedIps() {
  if (config.blockMethod === 'iptables') {
    return ipBlockStore.list();
  }

  try {
    const res = await fetch(`${config.crowdsec.apiUrl}/v1/decisions`, {
      headers: { 'X-Api-Key': config.crowdsec.apiKey },
    });
    if (!res.ok) {
      logger.warn('CrowdSec API returned non-OK status listing decisions', { status: res.status });
      return [];
    }
    const decisions = await res.json();
    if (!Array.isArray(decisions)) return [];
    return decisions.map((d) => ({
      ip: d.value,
      reason: d.reason || null,
      blockedAt: d.created_at || null,
      expiresAt: d.duration || null,
    }));
  } catch (err) {
    logger.warn('CrowdSec unreachable, returning empty block list', { error: err.message });
    return [];
  }
}

module.exports = { blockIp, unblockIp, listBlockedIps };
