const axios = require('axios');

/**
 * Récupère le nombre de joueurs connectés / max sur un serveur FiveM
 * Utilise l'endpoint /dynamic.json exposé nativement par FXServer
 */
async function getFivemPlayers(ip, port) {
  const url = `http://${ip}:${port}/dynamic.json`;
  const { data } = await axios.get(url, { timeout: 5000 });
  return {
    online: parseInt(data.clients, 10) || 0,
    max: parseInt(data.sv_maxclients, 10) || 0,
    hostname: data.hostname || null
  };
}

/**
 * Démarre la boucle de mise à jour du statut (présence du bot + nom du salon vocal)
 */
function startFivemStatusLoop(client, config) {
  const { ip, port, updateIntervalMs, statusVoiceChannelId, statusFormat } = config.fivem;

  const update = async () => {
    try {
      const { online, max } = await getFivemPlayers(ip, port);

      // Statut du bot (ex: "Regarde 42/500 joueurs")
      client.user.setActivity(`${online}/${max} joueurs`, { type: 3 }); // 3 = Watching

      // Nom du salon vocal (ex: "🟢 42/500 joueurs")
      if (statusVoiceChannelId && statusVoiceChannelId !== 'ID_SALON_VOCAL_STATUT') {
        const channel = await client.channels.fetch(statusVoiceChannelId).catch(() => null);
        if (channel) {
          const name = statusFormat.replace('{online}', online).replace('{max}', max);
          if (channel.name !== name) await channel.setName(name);
        }
      }
    } catch (err) {
      console.error('[FiveM Status] Impossible de contacter le serveur FiveM:', err.message);
      client.user.setActivity('Serveur FiveM hors ligne', { type: 3 });
    }
  };

  update();
  setInterval(update, updateIntervalMs || 60000);
}

module.exports = { getFivemPlayers, startFivemStatusLoop };
