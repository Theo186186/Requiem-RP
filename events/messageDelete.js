module.exports = {
  name: 'messageDelete',
  async execute(message) {
    try {
      if (!message.guild) return;
      if (message.partial) return; // contenu non mis en cache, impossible de vérifier
      if (message.author && message.author.bot) return;

      const mentionedUsers = message.mentions.users.filter((u) => u.id !== message.author.id);
      const pingedEveryone = message.mentions.everyone;
      if (mentionedUsers.size === 0 && !pingedEveryone) return;

      // On ne signale que si la suppression a eu lieu peu de temps après l'envoi (< 5 min)
      const ageMs = Date.now() - message.createdTimestamp;
      if (ageMs > 5 * 60 * 1000) return;

      const targets = pingedEveryone
        ? '@everyone/@here'
        : mentionedUsers.map((u) => u.tag).join(', ');

      await message.channel.send(
        `👻 **Ghost ping détecté** : ${message.author.tag} a mentionné ${targets} puis a supprimé son message.`
      ).catch(() => null);
    } catch (err) {
      console.error('[GhostPing] Erreur:', err);
    }
  }
};
