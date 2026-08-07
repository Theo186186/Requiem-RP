const { readJSON, writeJSON } = require('./storage');

const inviteCache = new Map();

async function cacheGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    const map = new Map();
    invites.forEach((inv) => map.set(inv.code, inv.uses));
    inviteCache.set(guild.id, map);
  } catch (err) {
    console.error('[Invites] Impossible de mettre en cache les invitations:', err.message);
  }
}

async function resolveUsedInvite(guild) {
  const before = inviteCache.get(guild.id) || new Map();
  const after = await guild.invites.fetch().catch(() => null);
  if (!after) return null;

  const used = after.find((inv) => {
    const prevUses = before.get(inv.code) || 0;
    return inv.uses > prevUses;
  });

  const map = new Map();
  after.forEach((inv) => map.set(inv.code, inv.uses));
  inviteCache.set(guild.id, map);

  return used || null;
}

function bumpInviterCount(inviterId) {
  const data = readJSON('invites.json');
  data[inviterId] = (data[inviterId] || 0) + 1;
  writeJSON('invites.json', data);
  return data[inviterId];
}

module.exports = { cacheGuildInvites, resolveUsedInvite, bumpInviterCount };
