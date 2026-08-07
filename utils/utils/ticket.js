const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const { readJSON, writeJSON } = require('./storage');

function closeButtonRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Fermer le ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );
}

/**
 * Ouvre un ticket : crée un salon sur le serveur STAFF, et prévient le joueur en MP.
 * Appelé depuis le menu déroulant posté sur le serveur RP principal.
 */
async function createTicket(interaction, categoryConfig, config) {
  const client = interaction.client;
  const user = interaction.user;
  const data = readJSON('tickets.json');

  if (data.openTickets[user.id]) {
    return interaction.reply({
      content: '❗ Tu as déjà un ticket ouvert. Réponds directement dans tes messages privés avec le bot.',
      ephemeral: true
    });
  }

  const ticketGuild = await client.guilds.fetch(config.ticketGuildId).catch(() => null);
  if (!ticketGuild) {
    return interaction.reply({
      content: "❌ Erreur de configuration : le serveur staff n'est pas accessible au bot.",
      ephemeral: true
    });
  }

  data.counter += 1;
  const ticketNumber = data.counter;

  const permissionOverwrites = [
    { id: ticketGuild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
  ];
  for (const roleId of config.tickets.staffRoleIds) {
    if (roleId && !roleId.startsWith('ID_')) {
      permissionOverwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels
        ]
      });
    }
  }

  const parent = categoryConfig.categoryChannelId.startsWith('ID_') ? null : categoryConfig.categoryChannelId;

  const channel = await ticketGuild.channels.create({
    name: `${categoryConfig.id}-${ticketNumber}`,
    type: ChannelType.GuildText,
    parent,
    permissionOverwrites,
    topic: `Ticket #${ticketNumber} | ${categoryConfig.label} | ${user.tag} (${user.id})`
  });

  data.openTickets[user.id] = {
    channelId: channel.id,
    number: ticketNumber,
    categoryId: categoryConfig.id,
    categoryLabel: categoryConfig.label
  };
  data.channelToUser[channel.id] = user.id;
  writeJSON('tickets.json', data);

  // Salon côté staff
  const staffMentions = config.tickets.staffRoleIds
    .filter((id) => id && !id.startsWith('ID_'))
    .map((id) => `<@&${id}>`)
    .join(' ');

  const staffEmbed = new EmbedBuilder()
    .setTitle(`${categoryConfig.emoji} Ticket #${ticketNumber} - ${categoryConfig.label}`)
    .setDescription(
      `**Joueur :** ${user.tag} (\`${user.id}\`)\n\n` +
      `Tout message envoyé ici sera transmis en message privé au joueur.\n` +
      `Tout message envoyé par le joueur en MP apparaîtra dans ce salon.`
    )
    .setColor(config.tickets.embed.color || '#5865F2')
    .setTimestamp();

  await channel.send({ content: staffMentions || undefined, embeds: [staffEmbed], components: [closeButtonRow()] })
    .catch((err) => console.error('[Ticket] Impossible d\'envoyer dans le salon staff (permissions ?):', err.message));

  // Log
  if (config.tickets.logsChannelId && !config.tickets.logsChannelId.startsWith('ID_')) {
    const logChannel = ticketGuild.channels.cache.get(config.tickets.logsChannelId);
    if (logChannel) {
      logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#57F287')
            .setDescription(`🎫 **Ticket #${ticketNumber}** ouvert par ${user.tag} — Catégorie: **${categoryConfig.label}** — ${channel}`)
            .setTimestamp()
        ]
      }).catch(() => null);
    }
  }

  // Message en MP au joueur
  const dmEmbed = new EmbedBuilder()
    .setTitle(`${categoryConfig.emoji} ${categoryConfig.label}`)
    .setDescription(`Ticket créé avec succès.\n\nUn membre du staff de **${config.serverName}** va te répondre ici même. Décris ta demande le plus clairement possible.`)
    .setColor('#57F287')
    .setFooter({ text: `Ticket #${ticketNumber}` });

  try {
    await user.send({ embeds: [dmEmbed], components: [closeButtonRow()] });
  } catch (err) {
    // MP fermés ou erreur d'envoi : on annule proprement la création du ticket
    // Le joueur a ses MP fermés : on annule la création
    await channel.delete().catch(() => null);
    delete data.openTickets[user.id];
    delete data.channelToUser[channel.id];
    writeJSON('tickets.json', data);
    return interaction.reply({
      content: "❌ Je n'arrive pas à t'envoyer de message privé. Active tes MP pour ce serveur (Confidentialité > Autoriser les messages privés) puis réessaie.",
      ephemeral: true
    });
  }

  await interaction.reply({ content: '✅ Ton ticket a été créé, va voir tes messages privés !', ephemeral: true });
}

/**
 * Ferme un ticket, que ce soit déclenché depuis le salon staff ou depuis le MP du joueur.
 */
async function closeTicket(interaction, config) {
  const client = interaction.client;
  const data = readJSON('tickets.json');

  let userId, ticketInfo;

  if (interaction.guild) {
    // Fermeture depuis le salon staff
    userId = data.channelToUser[interaction.channel.id];
    ticketInfo = userId ? data.openTickets[userId] : null;
  } else {
    // Fermeture depuis le MP du joueur
    userId = interaction.user.id;
    ticketInfo = data.openTickets[userId];
  }

  if (!ticketInfo) {
    return interaction.reply({ content: '❌ Ticket introuvable ou déjà fermé.', ephemeral: true });
  }

  await interaction.reply({ content: `🔒 Ticket #${ticketInfo.number} en cours de fermeture...` });

  // Log
  const ticketGuild = await client.guilds.fetch(config.ticketGuildId).catch(() => null);
  if (ticketGuild && config.tickets.logsChannelId && !config.tickets.logsChannelId.startsWith('ID_')) {
    const logChannel = ticketGuild.channels.cache.get(config.tickets.logsChannelId);
    if (logChannel) {
      logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#ED4245')
            .setDescription(`🔒 Ticket **#${ticketInfo.number}** fermé par ${interaction.user.tag}`)
            .setTimestamp()
        ]
      }).catch(() => null);
    }
  }

  // Prévenir le joueur (si fermeture faite côté staff) et supprimer le salon
  const user = await client.users.fetch(userId).catch(() => null);
  if (user) {
    user.send(`🔒 Le ticket \`#${ticketInfo.number}\` a été supprimé avec succès !`).catch(() => null);
  }

  const channel = ticketGuild ? ticketGuild.channels.cache.get(ticketInfo.channelId) : null;
  if (channel) setTimeout(() => channel.delete().catch(() => null), 3000);

  delete data.openTickets[userId];
  delete data.channelToUser[ticketInfo.channelId];
  writeJSON('tickets.json', data);
}

module.exports = { createTicket, closeTicket };
