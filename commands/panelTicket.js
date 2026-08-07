const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  guildScope: 'main',
  data: new SlashCommandBuilder().setName('panel-ticket').setDescription("Envoie le panneau d'ouverture de tickets"),

  async execute(interaction) {
    const cfg = config.tickets.embed;
    const embed = new EmbedBuilder().setTitle(cfg.title).setDescription(cfg.description).setColor(cfg.color || '#5865F2');
    if (cfg.imageUrl) embed.setImage(cfg.imageUrl);
    if (cfg.footerText) embed.setFooter({ text: cfg.footerText });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('Sélectionnez un ticket à ouvrir')
      .addOptions(config.tickets.categories.map((cat) => ({ label: cat.label, description: cat.description, value: cat.id, emoji: cat.emoji })));

    await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] })
      .catch((err) => console.error('[Panel] Erreur:', err.message));
    await interaction.reply({ content: '✅ Panneau de tickets envoyé.', ephemeral: true });
  }
};
