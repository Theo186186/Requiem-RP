const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  guildScope: 'main',
  data: new SlashCommandBuilder()
    .setName('msg')
    .setDescription('Envoie un message panel (embed) dans ce salon')
    .addStringOption((opt) => opt.setName('message').setDescription('Texte du message (utilise \\n pour les retours à la ligne)').setRequired(true))
    .addStringOption((opt) => opt.setName('couleur').setDescription('Code couleur hex, ex: #5865F2').setRequired(true))
    .addStringOption((opt) => opt.setName('titre').setDescription('Titre du panel (optionnel)').setRequired(false))
    .addStringOption((opt) => opt.setName('banniere').setDescription('URL d\'une image affichée en bas (optionnel)').setRequired(false)),

  async execute(interaction) {
    const rawMessage = interaction.options.getString('message');
    const color = interaction.options.getString('couleur');
    const titre = interaction.options.getString('titre');
    const banniere = interaction.options.getString('banniere');

    const description = rawMessage.replace(/\\n/g, '\n');

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return interaction.reply({ content: '❌ Couleur invalide. Utilise un format hex, ex: #5865F2.', ephemeral: true });
    }

    const embed = new EmbedBuilder().setDescription(description).setColor(color);
    if (titre) embed.setTitle(titre);
    if (banniere) embed.setImage(banniere);

    await interaction.channel.send({ embeds: [embed] })
      .catch((err) => console.error('[Msg Annonce] Erreur:', err.message));
    await interaction.reply({ content: '✅ Message envoyé.', ephemeral: true });
  }
};
