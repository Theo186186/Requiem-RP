const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const { readJSON } = require('../utils/storage');
const { record, reset, punishAndAlert } = require('../utils/antiAbuse');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    try {
      if (message.author.bot) return;

      if (message.guild && message.mentions.everyone) {
        const windowMs = config.antiAbuse.pingSpam.windowMinutes * 60000;
        const count = record('pingSpam', message.author.id, windowMs);
        if (count >= config.antiAbuse.pingSpam.maxActions) {
          reset('pingSpam', message.author.id);
          await punishAndAlert({
            guild: message.guild,
            userId: message.author.id,
            permissionsToStrip: [PermissionFlagsBits.MentionEveryone],
            reason: `a ping @everyone/@here ${count} fois en moins d'une minute`,
            config,
            client: message.client
          });
        }
      }

      // MP du joueur -> transmis automatiquement dans le salon staff
      if (!message.guild) {
        const data = readJSON('tickets.json');
        const ticket = data.openTickets[message.author.id];
        if (!ticket) return;

        const ticketGuild = await message.client.guilds.fetch(config.ticketGuildId).catch(() => null);
        const channel = ticketGuild ? ticketGuild.channels.cache.get(ticket.channelId) : null;
        if (!channel) return;

        const embed = new EmbedBuilder()
          .setTitle(`${message.author.username} (Joueur)`)
          .setDescription(message.content || '*[pièce jointe]*')
          .setColor('#5865F2')
          .setTimestamp();

        const files = message.attachments.map((a) => a.url);
        await channel.send({ embeds: [embed], files }).catch((err) =>
          console.error('[Relais] Erreur envoi salon staff:', err.message)
        );
      }
    } catch (err) {
      console.error('[messageCreate] Erreur non bloquante:', err);
    }
  }
};
