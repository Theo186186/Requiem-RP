/**
 * Vérifie si l'utilisateur peut utiliser les commandes du bot :
 * soit c'est le owner (config.ownerId), soit il possède un des rôles listés dans config.allowedRoleIds.
 */
function canUseBot(interaction, config) {
  if (interaction.user.id === config.ownerId) return true;

  const member = interaction.member;
  if (!member || !member.roles) return false;

  const allowedRoleIds = (config.allowedRoleIds || []).filter((id) => id && !id.startsWith('ID_'));
  if (allowedRoleIds.length === 0) return false;

  return member.roles.cache.some((role) => allowedRoleIds.includes(role.id));
}

module.exports = { canUseBot };
