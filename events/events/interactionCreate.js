const config = require('../config.json');
const { createTicket, closeTicket } = require('../utils/ticket');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // Commandes slash
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      // Menu déroulant d'ouverture de ticket
      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const categoryId = interaction.values[0];
        const categoryConfig = config.tickets.categories.find((c) => c.id === categoryId);
        if (!categoryConfig) return;
        await createTicket(interaction, categoryConfig, config);
        return;
      }

      // Bouton fermer le ticket
      if (interaction.isButton() && interaction.customId === 'ticket_close') {
        await closeTicket(interaction, config);
        return;
      }
    } catch (err) {
      console.error('[Interaction] Erreur non bloquante:', err);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        interaction.reply({ content: '❌ Une erreur est survenue, réessaie.', ephemeral: true }).catch(() => null);
      }
    }
  }
};
