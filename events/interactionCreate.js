const config = require('../config.json');
const { createTicket, closeTicket } = require('../utils/ticket');
const { canUseBot } = require('../utils/permissions');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        if (!canUseBot(interaction, config)) {
          return interaction.reply({ content: "⛔ Tu n'as pas la permission d'utiliser cette commande.", ephemeral: true });
        }
        const scope = interaction.guildId === config.ticketGuildId ? 'ticket' : 'main';
        const command = interaction.client.commands.get(`${scope}:${interaction.commandName}`);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        const categoryId = interaction.values[0];
        const categoryConfig = config.tickets.categories.find((c) => c.id === categoryId);
        if (!categoryConfig) return;
        await createTicket(interaction, categoryConfig, config);
        return;
      }

      if (interaction.isButton() && interaction.customId === 'ticket_close') {
        await closeTicket(interaction, config);
        return;
      }
    } catch (err) {
      console.error('[Interaction] Erreur:', err);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true }).catch(() => null);
      }
    }
  }
};
