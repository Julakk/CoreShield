#!/usr/bin/env bash
# Menerbitkan / menghapus sertifikat Let's Encrypt untuk domain yang vhost-nya dikelola CoreShield.
# Dijalankan lewat sudo dengan aturan sempit (lihat scripts/coreshield-sudoers.example).
set -euo pipefail

ACTION="${1:-}"
DOMAIN="${2:-}"

ACME_ROOT=/var/www/coreshield-acme
ENV_FILE=/opt/coreshield/.env
SITES_AVAILABLE=/etc/nginx/sites-available
SITES_ENABLED=/etc/nginx/sites-enabled

usage() {
  echo "Usage: $0 {issue|delete} <domain>" >&2
  exit 1
}

[[ -n "$ACTION" && -n "$DOMAIN" ]] || usage

DOMAIN_REGEX='^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$'
if [[ ${#DOMAIN} -gt 253 || ! "$DOMAIN" =~ $DOMAIN_REGEX ]]; then
  echo "Invalid domain: $DOMAIN" >&2
  exit 1
fi

CONF="$SITES_AVAILABLE/$DOMAIN.conf"
ENABLED="$SITES_ENABLED/$DOMAIN.conf"
NAME="${DOMAIN,,}"

case "$ACTION" in
  issue)
    if [[ ! -f "$CONF" || -L "$CONF" ]]; then
      echo "No CoreShield vhost for $DOMAIN" >&2
      exit 1
    fi
    if ! head -n 1 "$CONF" | grep -q '^# Managed by CoreShield'; then
      echo "Vhost for $DOMAIN is not managed by CoreShield" >&2
      exit 1
    fi
    EMAIL="$(grep -E '^CERTBOT_EMAIL=' "$ENV_FILE" | head -n 1 | cut -d= -f2- | tr -d '"\047 ' || true)"
    if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
      echo "CERTBOT_EMAIL is missing or invalid in $ENV_FILE" >&2
      exit 1
    fi
    mkdir -p "$ACME_ROOT"
    exec certbot certonly --webroot -w "$ACME_ROOT" -d "$NAME" --cert-name "$NAME" \
      --non-interactive --agree-tos -m "$EMAIL" --deploy-hook "systemctl reload nginx"
    ;;
  delete)
    if [[ -e "$CONF" || -L "$CONF" || -e "$ENABLED" || -L "$ENABLED" ]]; then
      echo "Vhost for $DOMAIN still exists; refusing to delete its certificate" >&2
      exit 1
    fi
    RENEWAL="/etc/letsencrypt/renewal/$NAME.conf"
    if [[ ! -f "$RENEWAL" ]] || ! grep -q "$ACME_ROOT" "$RENEWAL"; then
      echo "No CoreShield-issued certificate named $NAME" >&2
      exit 1
    fi
    exec certbot delete --cert-name "$NAME" --non-interactive
    ;;
  *)
    usage
    ;;
esac
