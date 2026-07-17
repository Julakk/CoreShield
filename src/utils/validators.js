// Strict allow-list style validation. Reject anything that doesn't match —
// never attempt to "sanitize" or strip characters from shell-bound input.

const DOMAIN_REGEX =
  /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})$/;

const IPV4_CIDR_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}\/(3[0-2]|[12]?\d)$/;

const IPV6_CIDR_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})\/(12[0-8]|1[01]\d|[1-9]?\d)$/;

function isValidDomain(domain) {
  return typeof domain === 'string' && DOMAIN_REGEX.test(domain);
}

function isValidIp(ip) {
  return typeof ip === 'string' && (IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip));
}

// A single IP OR a CIDR range (e.g. 203.0.113.0/24) — used for blocking,
// where ranges are a legitimate and common use case (blocking an entire
// subnet an attacker is rotating through).
function isValidIpOrCidr(value) {
  if (typeof value !== 'string') return false;
  return (
    IPV4_REGEX.test(value) ||
    IPV6_REGEX.test(value) ||
    IPV4_CIDR_REGEX.test(value) ||
    IPV6_CIDR_REGEX.test(value)
  );
}

function baseAddress(ipOrCidr) {
  return ipOrCidr.split('/')[0];
}

// Prevent blocking private/loopback/reserved ranges by mistake (self-lockout risk)
function isBlockableIp(ipOrCidr) {
  if (!isValidIpOrCidr(ipOrCidr)) return false;
  const base = baseAddress(ipOrCidr);
  const privateRanges = [
    /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\.0\.0\.0$/, /^::1$/,
  ];
  return !privateRanges.some((re) => re.test(base));
}

module.exports = {
  isValidDomain,
  isValidIp,
  isValidIpOrCidr,
  isBlockableIp,
};
