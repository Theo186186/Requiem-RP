const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const { record, reset, punishAndAlert } = require('../utils/antiAbuse');

module.exports = {
  name: 'guildAuditLogEntryCreate',
  async execute(auditLogEntry, guild) {
    try {
      const { action, executorId } = auditLogEntry;
      if (!executorId || executorId === guild.client.user.id) return;

      if (action === AuditLogEvent.MemberBanAdd || action === AuditLogEvent.MemberKick) {
        const windowMs = config.antiAbuse.banKick.windowMinutes * 60000;
        const count = record('banKick', executorId, windowMs);
        if (count >= config.antiAbuse.banKick.maxActions) {
          reset('banKick', executorId);
          await punishAndAlert({
            guild, userId: executorId,
            permissionsToStrip: [PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers],
            reason: `a banni/exclu ${count} membre(s) en moins de ${config.antiAbuse.banKick.windowMinutes} minute(s)`,
            config, client: guild.client
          });
        }
      }

      if (action === AuditLogEvent.ChannelDelete || action === AuditLogEvent.RoleDelete) {
        const windowMs = config.antiAbuse.deletions.windowMinutes * 60000;
        const count = record('deletions', executorId, windowMs);
        if (count >= config.antiAbuse.deletions.maxActions) {
          reset('deletions', executorId);
          await punishAndAlert({
            guild, userId: executorId,
            permissionsToStrip: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],
            reason: `a supprimé ${count} salon(s)/rôle(s) en moins de ${config.antiAbuse.deletions.windowMinutes} minute(s)`,
            config, client: guild.client
          });
        }
      }
    } catch (err) {
      console.error('[AntiAbuse] Erreur:', err);
    }
  }
};
