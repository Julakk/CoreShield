// Strict allow-list style validation. Reject anything that doesn't match —
// never attempt to "sanitize" or strip characters from shell-bound input.

const DOMAIN_REGEX =
  /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})$/;

function isValidDomain(domain) {
  return typeof domain === 'string' && DOMAIN_REGEX.test(domain);
}

function isValidIp(ip) {
  return typeof ip === 'string' && (IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip));
}

// Prevent blocking private/loopback/reserved ranges by mistake (self-lockout risk)
function isBlockableIp(ip) {
  if (!isValidIp(ip)) return false;
  const privateRanges = [
    /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\.0\.0\.0$/, /^::1$/,
  ];
  return !privateRanges.some((re) => re.test(ip));
}

module.exports = { isValidDomain, isValidIp, isBlockableIp };
