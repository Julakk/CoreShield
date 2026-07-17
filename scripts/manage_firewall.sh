#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-}"
IP="${2:-}"

usage() {
  echo "Usage: $0 {block|unblock} <ip-address-or-cidr>" >&2
  exit 1
}

if [[ -z "$ACTION" || -z "$IP" ]]; then
  usage
fi

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

is_valid_cidr() {
  local value="$1"
  local addr="${value%%/*}"
  local prefix="${value##*/}"

  [[ "$value" == *"/"* ]] || return 1
  [[ "$prefix" =~ ^[0-9]+$ ]] || return 1

  if is_valid_ipv4 "$addr"; then
    (( prefix >= 0 && prefix <= 32 )) && echo "4" && return 0
  elif is_valid_ipv6 "$addr"; then
    (( prefix >= 0 && prefix <= 128 )) && echo "6" && return 0
  fi
  return 1
}

IP_VERSION=""
BASE_ADDR="$IP"

if [[ "$IP" == *"/"* ]]; then
  IP_VERSION="$(is_valid_cidr "$IP")" || {
    echo "ERROR: '$IP' is not a valid CIDR range. Refusing to proceed." >&2
    exit 2
  }
  BASE_ADDR="${IP%%/*}"
elif is_valid_ipv4 "$IP"; then
  IP_VERSION="4"
elif is_valid_ipv6 "$IP"; then
  IP_VERSION="6"
else
  echo "ERROR: '$IP' is not a valid IPv4/IPv6 address or CIDR range. Refusing to proceed." >&2
  exit 2
fi

case "$BASE_ADDR" in
  127.*|10.*|192.168.*|0.0.0.0|::1)
    echo "ERROR: refusing to block private/loopback/reserved address: $IP" >&2
    exit 3
    ;;
esac
if [[ "$BASE_ADDR" =~ ^172\.(1[6-9]|2[0-9]|3[01])\. ]]; then
  echo "ERROR: refusing to block private address: $IP" >&2
  exit 3
fi

if [[ "$IP_VERSION" == "4" ]]; then
  IPTABLES_BIN="iptables"
else
  IPTABLES_BIN="ip6tables"
fi

CHAIN="INPUT"

case "$ACTION" in
  block)
    if "$IPTABLES_BIN" -C "$CHAIN" -s "$IP" -j DROP 2>/dev/null; then
      echo "IP/range $IP is already blocked."
      exit 0
    fi
    "$IPTABLES_BIN" -I "$CHAIN" -s "$IP" -j DROP
    echo "Blocked $IP"
    ;;
  unblock)
    if ! "$IPTABLES_BIN" -C "$CHAIN" -s "$IP" -j DROP 2>/dev/null; then
      echo "IP/range $IP is not currently blocked."
      exit 0
    fi
    "$IPTABLES_BIN" -D "$CHAIN" -s "$IP" -j DROP
    echo "Unblocked $IP"
    ;;
  *)
    usage
    ;;
esac
