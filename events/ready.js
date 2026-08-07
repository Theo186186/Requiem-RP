const config = require('../config.json');
const { cacheGuildInvites } = require('../utils/invites');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    const guild = await client.guilds.fetch(config.mainGuildId).catch(() => null);
    if (guild) await cacheGuildInvites(guild);
    const ticketGuild = await client.guilds.fetch(config.ticketGuildId).catch(() => null);
    if (!ticketGuild) console.warn('⚠️ Bot non connecté au serveur STAFF.');
  }
};
