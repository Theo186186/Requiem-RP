const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function parseDuration(str) {
  const match = /^(\d+)\s*(s|sec|secondes?|m|min|minutes?|h|heures?|j|jours?)$/i.exec(str.trim());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, sec: 1000, seconde: 1000, secondes: 1000, m: 60000, min: 60000, minute: 60000, minutes: 60000, h: 3600000, heure: 3600000, heures: 3600000, j: 86400000, jour: 86400000, jours: 86400000 };
  const mult = multipliers[unit] || multipliers[unit.replace(/s$/, '')];
  return mult ? value * mult : null;
}

module.exports = {
  guildScope: 'main',
  data: new SlashCommandBuilder()
    .setName('tirage')
    .setDescription('Lance un tirage au sort')
    .addStringOption((opt) => opt.setName('duree').setDescription('Ex: 30s, 5m, 1h').setRequired(true))
    .addStringOption((opt) => opt.setName('message').setDescription('Description / lot').setRequired(true))
    .addIntegerOption((opt) => opt.setName('gagnants').setDescription('Nombre de gagnants (défaut 1)').setRequired(false)),

  async execute(interaction) {
    const durationStr = interaction.options.getString('duree');
    const description = interaction.options.getString('message');
    const winnersCount = interaction.options.getInteger('gagnants') || 1;
    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs < 5000) {
      return interaction.reply({ content: '❌ Durée invalide (ex: 30s, 5m, 1h).', ephemeral: true });
    }

    const endTimestamp = Math.floor((Date.now() + durationMs) / 1000);
    const embed = new EmbedBuilder().setTitle('🎉 Tirage au sort').setDescription(`${description}\n\nRéagis avec 🎉 pour participer !\nTirage <t:${endTimestamp}:R>`).setColor('#F1C40F');

    await interaction.reply({ embeds: [embed] });
    const message = await interaction.fetchReply();
    await message.react('🎉').catch(() => null);

    setTimeout(async () => {
      try {
        const fetched = await message.channel.messages.fetch(message.id);
        const reaction = fetched.reactions.cache.get('🎉');
        const users = reaction ? await reaction.users.fetch() : new Map();
        const participants = Array.from(users.values()).filter((u) => !u.bot);
        if (participants.length === 0) {
          await message.channel.send("😢 Personne n'a participé, aucun gagnant.");
          return;
        }
        const pool = [...participants];
        const winners = [];
        for (let i = 0; i < Math.min(winnersCount, pool.length); i++) {
          const idx = Math.floor(Math.random() * pool.length);
          winners.push(pool.splice(idx, 1)[0]);
        }
        await message.channel.send(`🎉 Félicitations ${winners.map((w) => `<@${w.id}>`).join(', ')} ! Tu remportes : **${description}**`);
      } catch (err) {
        console.error('[Tirage] Erreur:', err);
      }
    }, durationMs);
  }
};
