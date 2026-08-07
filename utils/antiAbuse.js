const { EmbedBuilder } = require('discord.js');

const trackers = new Map();

function getTracker(name) {
  if (!trackers.has(name)) trackers.set(name, new Map());
  return trackers.get(name);
}

function record(trackerName, userId, windowMs) {
  const tracker = getTracker(trackerName);
  const now = Date.now();
  const timestamps = (tracker.get(userId) || []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  tracker.set(userId, timestamps);
  return timestamps.length;
}

function reset(trackerName, userId) {
  getTracker(trackerName).delete(userId);
}

async function punishAndAlert({ guild, userId, permissionsToStrip, reason, config, client }) {
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  const rolesToRemove = member.roles.cache.filter(
    (role) => role.id !== guild.id && permissionsToStrip.some((perm) => role.permissions.has(perm))
  );

  if (rolesToRemove.size > 0) {
    await member.roles.remove(rolesToRemove).catch((err) =>
      console.error('[AntiAbuse] Impossible de retirer les rôles (hiérarchie ?):', err.message)
    );
  }

  const roleNames = rolesToRemove.map((r) => r.name).join(', ') || 'aucun (le staff n\'avait déjà plus le rôle concerné, ou hiérarchie insuffisante)';
  const description = `🚨 **${member.user.tag}** ${reason}\n\n**Rôle(s) retiré(s) :** ${roleNames}`;

  const owner = await client.users.fetch(config.ownerId).catch(() => null);
  if (owner) {
    owner.send(description).catch(() => null);
  } else {
    console.warn('[AntiAbuse] Impossible de contacter le owner (ownerId incorrect ?)');
  }

  if (config.antiAbuse.logChannelId && !config.antiAbuse.logChannelId.startsWith('ID_')) {
    const logChannel = guild.channels.cache.get(config.antiAbuse.logChannelId);
    if (logChannel) {
      logChannel.send({
        embeds: [new EmbedBuilder().setColor('#ED4245').setTitle('🚨 Sanction anti-abus automatique').setDescription(description).setTimestamp()]
      }).catch(() => null);
    }
  }
}

module.exports = { record, reset, punishAndAlert };
