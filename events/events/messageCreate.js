const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const { readJSON } = require('../utils/storage');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    try {
      if (message.author.bot) return;

      const data = readJSON('tickets.json');

      // Message envoyé en MP par un joueur -> transmis dans le salon staff
      if (!message.guild) {
        const ticket = data.openTickets[message.author.id];
        if (!ticket) return; // pas de ticket ouvert, on ignore

        const ticketGuild = await message.client.guilds.fetch(config.ticketGuildId).catch(() => null);
        const channel = ticketGuild ? ticketGuild.channels.cache.get(ticket.channelId) : null;
        if (!channel) {
          console.error('[Relais] Salon ticket introuvable sur le serveur staff (ticketGuildId / channelId incorrect ?)');
          return;
        }

        const embed = new EmbedBuilder()
          .setAuthor({ name: `${message.author.tag} (Joueur)`, iconURL: message.author.displayAvatarURL() })
          .setDescription(message.content || '*[pièce jointe]*')
          .setColor('#5865F2')
          .setTimestamp();

        const files = message.attachments.map((a) => a.url);
        await channel.send({ embeds: [embed], files }).catch((err) =>
          console.error('[Relais] Impossible d\'envoyer dans le salon staff (permissions ?):', err.message)
        );
        return;
      }

      // Message envoyé dans un salon ticket du serveur staff -> transmis en MP au joueur
      if (message.guild.id === config.ticketGuildId) {
        const userId = data.channelToUser[message.channel.id];
        if (!userId) return; // ce salon n'est pas un ticket

        const user = await message.client.users.fetch(userId).catch(() => null);
        if (!user) return;

        const embed = new EmbedBuilder()
          .setAuthor({ name: `${message.author.tag} (Staff)`, iconURL: message.author.displayAvatarURL() })
          .setDescription(message.content || '*[pièce jointe]*')
          .setColor('#57F287')
          .setTimestamp();

        const files = message.attachments.map((a) => a.url);
        await user.send({ embeds: [embed], files }).catch((err) =>
          console.error('[Relais] Impossible d\'envoyer le MP au joueur (MP fermés ?):', err.message)
        );
      }
    } catch (err) {
      console.error('[messageCreate] Erreur non bloquante:', err);
    }
  }
};
