const config = require('../config');
const logger = require('../utils/logger');

const COLORS = {
  success: 0x22e5c9,
  danger: 0xf0465b,
  warning: 0xf5a623,
  info: 0x6b6e75,
};

async function notify(event) {
  if (!config.discord.webhookUrl) return;

  const { title, description, color = 'info', fields = [] } = event;

  try {
    const res = await fetch(config.discord.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title,
            description,
            color: COLORS[color] ?? COLORS.info,
            fields: fields.map((f) => ({ name: f.name, value: String(f.value), inline: true })),
            footer: { text: 'CoreShield' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!res.ok) {
      logger.warn('Discord webhook returned non-OK status', { status: res.status });
    }
  } catch (err) {
    logger.warn('Discord webhook notification failed', { error: err.message });
  }
}

module.exports = { notify };
