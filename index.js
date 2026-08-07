require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');

process.on('unhandledRejection', (err) => console.error('❌ Promesse non gérée:', err));
process.on('uncaughtException', (err) => console.error('❌ Exception non attrapée:', err));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  const scope = command.guildScope || 'main';
  client.commands.set(`${scope}:${command.data.name}`, command);
}

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => {
      Promise.resolve(event.execute(...args)).catch((err) => console.error(`❌ Erreur event "${event.name}":`, err));
    });
  } else {
    client.on(event.name, (...args) => {
      Promise.resolve(event.execute(...args)).catch((err) => console.error(`❌ Erreur event "${event.name}":`, err));
    });
  }
}

client.login(process.env.TOKEN);
