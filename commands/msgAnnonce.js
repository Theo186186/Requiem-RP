const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { setPending } = require('../utils/pendingPanels');

module.exports = {
  guildScope: 'main',
  data: new SlashCommandBuilder()
    .setName('msg')
    .setDescription('Envoie un message panel (embed) dans ce salon')
    .addStringOption((opt) => opt.setName('couleur').setDescription('Code couleur hex, ex: #5865F2').setRequired(true))
    .addStringOption((opt) => opt.setName('titre').setDescription('Titre du panel (optionnel)').setRequired(false))
    .addStringOption((opt) => opt.setName('banniere').setDescription('URL d\'une image affichée en bas (optionnel)').setRequired(false)),

  async execute(interaction) {
    const color = interaction.options.getString('couleur');
    const titre = interaction.options.getString('titre');
    const banniere = interaction.options.getString('banniere');

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return interaction.reply({ content: '❌ Couleur invalide. Utilise un format hex, ex: #5865F2.', ephemeral: true });
    }

    setPending(interaction.user.id, { color, titre, banniere, channelId: interaction.channel.id });

    const modal = new ModalBuilder().setCustomId('panel_modal').setTitle('Contenu du message');

    const textInput = new TextInputBuilder()
      .setCustomId('panel_message')
      .setLabel('Texte du message')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    modal.addComponents(new ActionRowBuilder().addComponents(textInput));

    await interaction.showModal(modal);
  }
};
