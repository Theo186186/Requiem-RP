# Bot Discord Requiem RP - Statut FiveM / Tickets (ModMail) / Bienvenue / AutoRole

## ⚠️ Le bot doit être invité sur DEUX serveurs Discord
1. **Le serveur RP principal** (Requiem RP) : panneau de tickets, message de bienvenue, rôle Citoyen auto, statut FiveM.
2. **Le serveur Staff/Tickets** : c'est là que les salons de tickets sont créés, par catégorie.

Répète l'étape "Inviter le bot" (voir plus bas) sur les deux serveurs avec le même lien.

## Ce que fait le bot

1. **Statut FiveM en live** : nombre de joueurs affiché dans le statut du bot + option salon vocal.
2. **Rôle automatique "Citoyen"** : dès qu'un joueur arrive sur le serveur RP, il reçoit automatiquement le rôle configuré.
3. **Tickets façon ModMail** :
   - Le joueur choisit une catégorie dans le menu déroulant posté sur le serveur RP (`/panel-ticket`)
   - Le bot crée un salon **sur le serveur Staff**, dans la bonne catégorie (Légal, Illégal, etc.)
   - Le bot envoie un message privé au joueur : "Ticket créé avec succès"
   - **Tout ce que le joueur écrit en MP au bot** est relayé dans le salon staff correspondant
   - **Tout ce que le staff écrit dans le salon** est relayé en MP au joueur
   - Le bouton "Fermer le ticket" fonctionne des deux côtés (joueur en MP ou staff dans le salon)
4. **Bienvenue + tracking d'invitations** : qui a invité qui, nombre d'invitations, nombre total de membres.

## Installation

### 1. Créer le bot sur Discord
- https://discord.com/developers/applications → New Application
- Onglet **Bot** → active `SERVER MEMBERS INTENT` et `MESSAGE CONTENT INTENT`
- Récupère le **Token** (Bot) et l'**Application ID**

### 2. Inviter le bot sur les DEUX serveurs
- **OAuth2 → URL Generator** → coche `bot` + `applications.commands`
- Permissions : `Manage Channels`, `Manage Roles`, `Send Messages`, `Manage Messages`, `View Channels`, `Read Message History`
- Copie l'URL générée, ouvre-la, **invite le bot sur le serveur RP**, puis **recommence et invite-le aussi sur le serveur Staff**

⚠️ Sur le serveur RP, le rôle du bot doit être **au-dessus** du rôle "Citoyen" dans la liste des rôles (Réglages du serveur > Rôles), sinon il ne pourra pas l'attribuer.

### 3. Activer le mode développeur Discord
Réglages Discord → Avancés → Mode développeur (pour copier les IDs par clic droit).

### 4. Configurer le projet
```
npm install
cp .env.example .env
```
Remplis `.env` avec `TOKEN` et `CLIENT_ID`.

### 5. Remplir `config.json`

| Champ | Ce qu'il faut mettre |
|---|---|
| `mainGuildId` | ID du serveur **RP** |
| `ticketGuildId` | ID du serveur **Staff** |
| `autoRole.roleId` | ID du rôle **Citoyen** (sur le serveur RP) |
| `fivem.ip` / `fivem.port` | adresse de ton serveur FiveM |
| `fivem.statusVoiceChannelId` | salon vocal statut (optionnel) |
| `welcome.channelId` | salon de bienvenue (serveur RP) |
| `tickets.panelChannelId` | salon où sera envoyé le panneau (serveur RP) |
| `tickets.logsChannelId` | salon de logs (sur le serveur **Staff**) |
| `tickets.staffRoleIds` | rôle(s) staff qui voient les tickets (sur le serveur **Staff**) |
| `tickets.categories[].categoryChannelId` | ID de la **catégorie** sur le serveur **Staff** pour chaque type de ticket |
| `tickets.embed.title` / `description` / `footerText` / `imageUrl` | **le texte du panneau, personnalisable comme tu veux** (comme ta capture White FA) |

Crée d'abord les 5 catégories vides sur le serveur Staff (ex: "🟡・TICKETS LÉGAL"...), récupère leurs IDs.

### 6. Déployer la commande et lancer
```
npm run deploy
npm start
```

### 7. Envoyer le panneau
Sur le serveur RP, dans le salon voulu : `/panel-ticket`

## Personnaliser le texte du panneau
Tout se change dans `tickets.embed` du `config.json` :
- `title` : titre en haut de l'embed
- `description` : le texte principal (supporte `\n` pour les retours à la ligne et les emojis)
- `footerText` : la petite ligne en bas (ex: "• L'équipe Staff Requiem RP 🖤")
- `imageUrl` : lien direct vers une image/bannière (optionnel)
- `color` : couleur de la barre à gauche de l'embed (code hexadécimal)

Après modification, redémarre juste le bot (`npm start`) — pas besoin de refaire `npm run deploy`.

## Notes importantes
- Si le joueur a ses MP fermés pour le serveur, le bot le prévient et n'ouvre pas de ticket.
- Un joueur ne peut avoir qu'un seul ticket ouvert à la fois.
- Renommage du salon vocal limité à 2x/10min par Discord — garde `updateIntervalMs` à 60000 minimum, ou plus si tu utilises le salon vocal.
- Les données (tickets ouverts, invitations) sont dans `/data` en JSON simple.
