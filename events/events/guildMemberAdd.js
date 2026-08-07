const config = require('../config.json');
const { resolveUsedInvite, bumpInviterCount, cacheGuildInvites } = require('../utils/invites');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const { guild } = member;

    // On ignore les arrivées sur le serveur staff (auto-rôle et bienvenue = serveur RP uniquement)
    if (guild.id !== config.mainGuildId) return;

    // Attribution automatique du rôle Citoyen
    if (config.autoRole.enabled && config.autoRole.roleId && !config.autoRole.roleId.startsWith('ID_')) {
      await member.roles.add(config.autoRole.roleId).catch((err) =>
        console.error('[AutoRole] Impossible d\'ajouter le rôle Citoyen:', err.message)
      );
    }

    const channel = guild.channels.cache.get(config.welcome.channelId);
    if (!channel) return;

    const usedInvite = await resolveUsedInvite(guild);
    const memberCount = guild.memberCount;

    const lines = [`👑 Bienvenue à ${member}`];

    if (usedInvite && usedInvite.inviter) {
      const total = bumpInviterCount(usedInvite.inviter.id);
      lines.push(`🎉 Il a été invité par ${usedInvite.inviter}`);
      lines.push(`👑 Il a désormais **${total}** invitation${total > 1 ? 's' : ''}`);
    } else if (usedInvite && usedInvite.code === config.welcome.serverInviteName) {
      lines.push(`🎉 Il a rejoint avec l'url ${config.welcome.serverInviteName}`);
    } else {
      lines.push(`🎉 Il a rejoint via une invitation personnalisée ou expirée`);
    }

    lines.push(`🟠 Nous sommes désormais **${memberCount}** sur le discord ${config.serverName} !`);

    await channel.send(lines.join('\n')).catch((err) =>
      console.error('[Bienvenue] Impossible d\'envoyer le message (vérifie les permissions du bot sur ce salon):', err.message)
    );

    await cacheGuildInvites(guild);
  }
};
