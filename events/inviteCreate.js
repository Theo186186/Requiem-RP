const { cacheGuildInvites } = require('../utils/invites');

module.exports = {
  name: 'inviteCreate',
  async execute(invite) {
    if (invite.guild) await cacheGuildInvites(invite.guild);
  }
};
