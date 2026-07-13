#!/usr/bin/env bash
#
# manage_firewall.sh — block/unblock a single IPv4/IPv6 address via iptables/ip6tables.
#
# Usage:
#   manage_firewall.sh block   <ip>
#   manage_firewall.sh unblock <ip>
#
# Design notes (why this script is safe to call from Node with sudo):
#   1. "set -euo pipefail" — abort immediately on any error, unset variable,
#      or failed pipeline. No silent partial execution.
#   2. Input is validated with regex BEFORE it touches any command. If it
#      doesn't match, the script exits non-zero and does nothing.
#   3. Every value is passed to iptables as a separate, quoted argument —
#      never interpolated into a single string that could be re-parsed by
#      a shell. There is no eval, no backticks, no $() around user input.
#   4. The script only ever calls fixed binaries (iptables/ip6tables) with a
#      fixed, small set of flags. It cannot be repurposed to run arbitrary
#      commands, which is what makes it safe to grant via sudo without
#      granting full root.

set -euo pipefail

ACTION="${1:-}"
IP="${2:-}"

usage() {
  echo "Usage: $0 {block|unblock} <ip-address>" >&2
  exit 1
}

if [[ -z "$ACTION" || -z "$IP" ]]; then
  usage
fi

# --- Strict IP validation -----------------------------------------------
# Reject anything that isn't a plain, well-formed IPv4 or IPv6 address.
# This is a whitelist check, not sanitization — if it doesn't match, we
# refuse, rather than trying to strip "bad" characters.

IPV4_REGEX='^([0-9]{1,3}\.){3}[0-9]{1,3}$'
IPV6_REGEX='^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$'

is_valid_ipv4() {
  local ip="$1"
  [[ "$ip" =~ $IPV4_REGEX ]] || return 1
  local IFS='.'
  local -a octets=($ip)
  for octet in "${octets[@]}"; do
    if (( octet < 0 || octet > 255 )); then
      return 1
    fi
  done
  return 0
}

is_valid_ipv6() {
  [[ "$1" =~ $IPV6_REGEX ]]
}

IP_VERSION=""
if is_valid_ipv4 "$IP"; then
  IP_VERSION="4"
elif is_valid_ipv6 "$IP"; then
  IP_VERSION="6"
else
  echo "ERROR: '$IP' is not a valid IPv4 or IPv6 address. Refusing to proceed." >&2
  exit 2
fi

# --- Refuse private/loopback ranges (avoid accidental self-lockout) -----
case "$IP" in
  127.*|10.*|192.168.*|0.0.0.0|::1)
    echo "ERROR: refusing to block private/loopback/reserved address: $IP" >&2
    exit 3
    ;;
esac
if [[ "$IP" =~ ^172\.(1[6-9]|2[0-9]|3[01])\. ]]; then
  echo "ERROR: refusing to block private address: $IP" >&2
  exit 3
fi

# Select the correct binary for the IP family
if [[ "$IP_VERSION" == "4" ]]; then
  IPTABLES_BIN="iptables"
else
  IPTABLES_BIN="ip6tables"
fi

CHAIN="INPUT"

case "$ACTION" in
  block)
    # -C checks whether the rule already exists (idempotency); if it does,
    # we do nothing rather than inserting a duplicate DROP rule.
    if "$IPTABLES_BIN" -C "$CHAIN" -s "$IP" -j DROP 2>/dev/null; then
      echo "IP $IP is already blocked."
      exit 0
    fi
    "$IPTABLES_BIN" -I "$CHAIN" -s "$IP" -j DROP
    echo "Blocked $IP"
    ;;
  unblock)
    if ! "$IPTABLES_BIN" -C "$CHAIN" -s "$IP" -j DROP 2>/dev/null; then
      echo "IP $IP is not currently blocked."
      exit 0
    fi
    "$IPTABLES_BIN" -D "$CHAIN" -s "$IP" -j DROP
    echo "Unblocked $IP"
    ;;
  *)
    usage
    ;;
esac
