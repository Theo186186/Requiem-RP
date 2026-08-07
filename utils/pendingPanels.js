// Stocke temporairement couleur/titre/bannière pendant que l'utilisateur remplit le texte dans le modal
const pending = new Map();

function setPending(userId, data) {
  pending.set(userId, data);
}

function getPending(userId) {
  return pending.get(userId);
}

function deletePending(userId) {
  pending.delete(userId);
}

module.exports = { setPending, getPending, deletePending };
