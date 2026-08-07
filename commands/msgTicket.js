const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const { readJSON } = require('../utils/storage');

function getHighestRoleName(member) {
  if (!member) return 'Staff';
  const roles = member.roles.cache.filter((r) => r.id !== member.guild.id).sort((a, b) => b.position - a.position);
  return roles.first() ? roles.first().name : 'Staff';
}

module.exports = {
  guildScope: 'ticket',
  data: new SlashCommandBuilder()
    .setName('msg')
    .setDescription('Envoie un message au joueur de ce ticket')
    .addStringOption((opt) => opt.setName('message').setDescription('Le message à envoyer au joueur').setRequired(true)),

  async execute(interaction) {
    const data = readJSON('tickets.json');
    const userId = data.channelToUser[interaction.channel.id];
    if (!userId) {
      return interaction.reply({ content: "❌ Ce salon n'est pas un ticket.", ephemeral: true });
    }

    const user = await interaction.client.users.fetch(userId).catch(() => null);
    if (!user) {
      return interaction.reply({ content: '❌ Joueur introuvable.', ephemeral: true });
    }

    const content = interaction.options.getString('message');
    const roleName = getHighestRoleName(interaction.member);

    const embed = new EmbedBuilder()
      .setTitle(`${roleName} — ${interaction.user.username}`)
      .setDescription(content)
      .setColor('#57F287')
      .setFooter({ text: config.serverName });

    const sent = await user.send({ embeds: [embed] }).catch(() => null);
    if (!sent) {
      return interaction.reply({ content: '❌ Impossible d\'envoyer le message (MP fermés côté joueur).', ephemeral: true });
    }

    await interaction.reply({ content: '✅ Message envoyé au joueur.', ephemeral: true });
  }
};
