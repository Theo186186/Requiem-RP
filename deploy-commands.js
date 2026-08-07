require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config.json');

const mainCommands = [];
const ticketCommands = [];

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  const scope = command.guildScope || 'main';
  if (scope === 'ticket') ticketCommands.push(command.data.toJSON());
  else mainCommands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Déploiement de ${mainCommands.length} commande(s) sur le serveur principal...`);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, config.mainGuildId), { body: mainCommands });

    console.log(`Déploiement de ${ticketCommands.length} commande(s) sur le serveur staff...`);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, config.ticketGuildId), { body: ticketCommands });

    console.log('✅ Commandes déployées avec succès.');
  } catch (err) {
    console.error(err);
  }
})();
