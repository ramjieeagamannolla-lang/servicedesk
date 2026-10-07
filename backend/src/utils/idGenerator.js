const { nextSequence } = require('../models/Counter');

async function generateTicketNumber() {
  const seq = await nextSequence('ticket');
  return `INC-${seq}`;
}

async function generateAssetTag(type) {
  const prefixes = {
    LAPTOP: 'LAP',
    DESKTOP: 'DSK',
    MONITOR: 'MON',
    MOBILE: 'MOB',
    PRINTER: 'PRN',
    SOFTWARE: 'SFT',
    NETWORK_DEVICE: 'NET',
    OTHER: 'AST',
  };
  const prefix = prefixes[type] || 'AST';
  const seq = await nextSequence('asset');
  return `${prefix}-${seq}`;
}

module.exports = { generateTicketNumber, generateAssetTag };
