require('dotenv').config();
const {Client: DiscordClient, Intents} = require('discord.js');

const {RankCommand} = require('./commands/rank');
const {TopCommand} = require('./commands/top');

const {sqlConnection, GetUserLevel, UpdateMemberXp, GetServerLogChannel, RegisterUser} = require('./database.js');

const discordClient = new DiscordClient({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]});

const botStatuses = ["mic!help", "Portal 2 :3", "c'est qui Rem?", "vous êtes toujours là?", "OP PLZ NERF", "RUSH B CYKA",
"se faire passer pour Dieu", "faire l'arbre en titubant", "avoir la flemme", "manger", "t ki?",
"asking for da wae", "dominer le monde", "j'ai plus d'inspi", "la pétanque",
"vous avez des idées?", "tabasser MEE6", "frétiller", "manger des choux à la crème", "farmer l'xp",
"être un bot de type acier", "I am mad Bot, it's so cooool, sonuvabitch", "ne pas être supprimé par Discord"];

const commands = [new RankCommand(), new TopCommand()];


function changeBotStatus(){
    discordClient.user.setPresence({activities: [{name: getRandomStatus()}]});
}

function getRandomStatus(){
    return botStatuses[Math.round(Math.random() * (botStatuses.length - 1))];
}

function canMemberEarnXp(channel, member){
    if(member.user.bot) return false;
    if(member.voice.selfMute || member.voice.selfDeaf) return false;
    
    return channel.members
        .filter(user => user.id != member.id)
        .filter(user => !user.user.bot)
        .filter(user => !user.voice.selfMute && !user.voice.selfDeaf)
        .size != 0;
}

async function updateMemberXp(guild, member){
    const guildId = guild.id;
    const memberId = member.id;

    const oldLevel = await GetUserLevel(guildId, memberId);
    await UpdateMemberXp(guildId, memberId);
    const newLevel = await GetUserLevel(guildId, memberId);

    if(newLevel > oldLevel) {
        //Envoyer un message: on commence par récupérer le salon dans lequel le message doit être envoyé
        //TODO vérifier les erreurs
        const logChannelId = await GetServerLogChannel(guildId);
        const logChannel = await discordClient.channels.fetch(logChannelId);
        
        //Envoi du message
        await logChannel.send(`Félicitations <@${memberId}>, vous venez de passer au niveau ${newLevel} !`);
    }
}

function updateMembersXp(){
    discordClient.guilds.cache.each(guild => {
        guild.channels.cache
        .filter(channel => channel.isVoice() && channel.id !== guild.afkChannelId)
        .each(channel => {
            channel.members
            .filter(member => canMemberEarnXp(channel, member))
            .each(member => updateMemberXp(guild, member));
        });
    });
}

discordClient.on('ready', () => {
    const guildId = '375698086942736384';
    const guild = discordClient.guilds.cache.get(guildId);
    const commandManager = guild.commands;

    commands.forEach(command => command.create(commandManager));
});

discordClient.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;

    const commandName = interaction.commandName;
    const foundCommand = await commands.find(command => command.commandName === commandName);

    if(foundCommand !== undefined)
        foundCommand.execute(interaction, sqlConnection);
});

discordClient.on('voiceStateUpdate', async (oldState, newState) => {
    if(oldState.member.user.bot || newState == null) return;

    await RegisterUser(oldState.guild.id, oldState.member.user.id);
});

discordClient.on('ready', async () => {
    changeBotStatus();

    setInterval(() => {
        changeBotStatus();
    }, 3600000);

    setInterval(() => {
        updateMembersXp();
    }, 60000);
});

discordClient.login(process.env.BOT_TOKEN);
