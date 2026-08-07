const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const { createTicket, closeTicket } = require('../utils/ticket');
const { canUseBot } = require('../utils/permissions');
const { getPending, deletePending } = require('../utils/pendingPanels');

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

      if (interaction.isModalSubmit() && interaction.customId === 'panel_modal') {
        const pending = getPending(interaction.user.id);
        if (!pending) {
          return interaction.reply({ content: '❌ Session expirée, relance la commande /msg.', ephemeral: true });
        }
        deletePending(interaction.user.id);

        const text = interaction.fields.getTextInputValue('panel_message');
        const embed = new EmbedBuilder().setDescription(text).setColor(pending.color);
        if (pending.titre) embed.setTitle(pending.titre);
        if (pending.banniere) embed.setImage(pending.banniere);

        const channel = await interaction.client.channels.fetch(pending.channelId).catch(() => null);
        if (channel) {
          await channel.send({ embeds: [embed] }).catch((err) => console.error('[Msg Annonce] Erreur:', err.message));
        }
        await interaction.reply({ content: '✅ Message envoyé.', ephemeral: true });
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
