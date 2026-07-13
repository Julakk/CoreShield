#!/data/data/com.termux/files/usr/bin/bash
#
# CoreShield - block_ip.sh
# -------------------------
# Blocks a given IP address using iptables. Designed to run from
# Termux (rooted device with iptables installed) or any standard
# Linux CLI with iptables + sudo/root access.
#
# Usage:
#   ./block_ip.sh <IP_ADDRESS>
#
# Notes:
#   - Requires root privileges (Termux: `tsu` / `su`, or run with sudo on Linux).
#   - Rules added here are NOT persistent across reboots unless you
#     save them (see the "Persistence" note at the bottom).

set -euo pipefail

# ---- Input validation ----
if [ $# -ne 1 ]; then
    echo "Usage: $0 <IP_ADDRESS>"
    exit 1
fi

TARGET_IP="$1"

# Basic IPv4 format validation (not exhaustive, but catches typos)
IPV4_REGEX='^([0-9]{1,3}\.){3}[0-9]{1,3}$'
if [[ ! $TARGET_IP =~ $IPV4_REGEX ]]; then
    echo "Error: '$TARGET_IP' is not a valid IPv4 address."
    exit 1
fi

# ---- Check for root/iptables availability ----
if ! command -v iptables >/dev/null 2>&1; then
    echo "Error: iptables is not installed or not in PATH."
    echo "On Termux: pkg install iptables root-repo (requires root)."
    exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
    echo "Error: this script must be run as root."
    echo "Termux: prefix the command with 'su -c' or use 'tsu'."
    echo "Linux:  run with 'sudo ./block_ip.sh <IP_ADDRESS>'."
    exit 1
fi

# ---- Check if the IP is already blocked ----
if iptables -C INPUT -s "$TARGET_IP" -j DROP 2>/dev/null; then
    echo "IP $TARGET_IP is already blocked. No action taken."
    exit 0
fi

# ---- Block the IP ----
iptables -A INPUT -s "$TARGET_IP" -j DROP
echo "Successfully blocked IP: $TARGET_IP"

# ---- Persistence note ----
# These rules live in memory only and will be cleared on reboot.
# To persist rules on standard Linux distros:
#   sudo apt install iptables-persistent
#   sudo netfilter-persistent save
#
# On Termux (rooted), consider a boot script via Termux:Boot
# that re-applies your saved rules from a local rules file.

exit 0
