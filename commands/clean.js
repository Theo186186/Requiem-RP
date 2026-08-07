const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  guildScope: 'main',
  data: new SlashCommandBuilder().setName('clean').setDescription('Supprime tous les messages du salon (max 14 jours)'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.channel;
    let totalDeleted = 0;
    try {
      let keepGoing = true;
      while (keepGoing) {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size === 0) break;
        const deletable = messages.filter((m) => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
        if (deletable.size === 0) { keepGoing = false; break; }
        const deleted = await channel.bulkDelete(deletable, true);
        totalDeleted += deleted.size;
        if (deleted.size < 2) keepGoing = false;
      }
    } catch (err) {
      console.error('[Clean] Erreur:', err);
    }
    await interaction.editReply(`🧹 ${totalDeleted} message(s) supprimé(s).`);
  }
};
