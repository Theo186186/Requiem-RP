const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const DEFAULTS = {
  'tickets.json': { counter: 0, openTickets: {}, channelToUser: {} },
  'invites.json': {}
};

function ensureFile(file) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    const defaultContent = DEFAULTS[file] !== undefined ? DEFAULTS[file] : {};
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    console.log(`[Storage] Fichier manquant recréé automatiquement : data/${file}`);
  }
  return filePath;
}

function readJSON(file) {
  const filePath = ensureFile(file);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(file, data) {
  const filePath = ensureFile(file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readJSON, writeJSON };
