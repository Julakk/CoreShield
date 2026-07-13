# CoreShield

CoreShield is a lightweight security toolkit for hardening and protecting web-facing infrastructure. It combines a reverse-proxy configuration template, IP-blocking tooling for rapid incident response, and a CI/CD pipeline for automated deployment.

## Features

- **Reverse Proxy Template** — Ready-to-adapt Nginx configuration for routing traffic to a backend service.
- **IP Blocking Script** — CLI tool (Termux/Linux compatible) to block malicious IPs via `iptables`.
- **Automated Deployment** — GitHub Actions workflow that runs on every push to `main`.

## Project Structure

```
CoreShield/
├── config/
│   └── nginx.conf        # Reverse proxy template
├── scripts/
│   └── block_ip.sh        # IP blocking utility
└── .github/workflows/
    └── deploy.yml          # CI/CD pipeline
```

## Prerequisites

- Linux server (or Termux on Android) with root/sudo access
- `nginx` installed for reverse proxy usage
- `iptables` installed for IP blocking
- GitHub repository with configured deployment secrets (if using the Actions workflow)

## Usage

### 1. Configure the Reverse Proxy

Copy `config/nginx.conf` to your Nginx sites directory and replace the placeholder backend address:

```bash
sudo cp config/nginx.conf /etc/nginx/sites-available/coreshield
sudo ln -s /etc/nginx/sites-available/coreshield /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Block a Malicious IP

```bash
chmod +x scripts/block_ip.sh
./scripts/block_ip.sh <IP_ADDRESS>
```

### 3. Deploy via GitHub Actions

Push to `main` and the workflow in `.github/workflows/deploy.yml` will trigger automatically. Configure any required secrets (e.g. `SSH_HOST`, `SSH_KEY`) under **Repository Settings → Secrets and variables → Actions**.

## Security Notes

- Never commit real IP addresses, tokens, or credentials — use environment variables or GitHub Secrets.
- Review `iptables` rules regularly; this script appends rules and does not persist them across reboots by default (see script comments for persistence options).
- Test Nginx config changes with `nginx -t` before reloading in production.

## License

MIT License — use at your own risk. Contributions welcome via pull request.
