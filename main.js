require('dotenv').config();
const {Client: DiscordClient, Intents, MessageEmbed} = require('discord.js');
const {Client: PostgresClient} = require('pg');

const {RankCommand} = require('./commands/rank');
const {TopCommand} = require('./commands/top');

const discordClient = new DiscordClient({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});

const sqlConnection = new PostgresClient({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const botStatuses = ["mic!help", "Portal 2 :3", "c'est qui Rem?", "vous êtes toujours là?", "OP PLZ NERF", "RUSH B CYKA",
"se faire passer pour Dieu", "faire l'arbre en titubant", "avoir la flemme", "manger", "t ki?",
"asking for da wae", "dominer le monde", "j'ai plus d'inspi", "la pétanque",
"vous avez des idées?", "tabasser MEE6", "frétiller", "manger des choux à la crème", "farmer l'xp",
"être un bot de type acier", "I am mad Bot, it's so cooool, sonuvabitch", "ne pas être supprimé par Discord"];

const commands = [new RankCommand(), new TopCommand()];

sqlConnection.connect()
    .catch(_ => console.log('Unable to connect to the database.'));

function changeBotStatus(){
    discordClient.user.setPresence({activities: [{name: getRandomStatus()}]});
}

function getRandomStatus(){
    return botStatuses[Math.round(Math.random() * botStatuses.length)];
}

function canMemberEarnXp(member, channel){ //TODO merge filters when it's done
    return channel.filter(user => user.id != member.id)
                  .filter(user => !user.user.bot)
                  .filter(user => !user.voice.selfMute && !user.voice.selfDeaf)
                  .size != 0;
}

async function updateMemberXp(guildId, memberId){
    const getLevelQuery = `SELECT lastlevel FROM guild_${guildId} WHERE id='${memberId}'`;
    
    const oldLevel = await sqlConnection.query(getLevelQuery);
    await sqlConnection.query(`CALL UpdateMemberXp(${guildId}, ${memberId})`)
    const newLevel = await sqlConnection.query(getLevelQuery);

    if(newLevel > oldLevel) {
        //Envoyer un message
    }
}

function updateMembersXp(){
    discordClient.guilds.cache.each(guild => {
        guild.channels.cache
        .filter(channel => channel.isVoice() && channel.id !== guild.afkChannelId)
        .each(channel => {
            channel.members
            .filter(member => canMemberEarnXp(member, channel))
            .each(member => updateMemberXp(member, guild));
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
    await commands.find(command => command.commandName === commandName).execute(interaction, sqlConnection);
});

/*discordClient.on('guildCreate', guild => {
    sqlConnection.query(`CALL RegisterNewGuild(${guild.id})`);
});*/

/*discordClient.on('voiceStateUpdate', (oldState, newState) => {
    if(oldState.member.user.bot || newState == null) return;

    sqlConnection.query(`CALL CheckUserExistence(${oldState.guild.id}, ${oldState.member.user.id})`);
});*/

discordClient.on('ready', async () => {
    /*setInterval(() => {
        changeBotStatus();
    }, 10000);

    setInterval(() => {
        updateMembersXp();
    }, 60000);*/

    const date = await sqlConnection.query('SELECT NOW()');
    console.log(date);
});

discordClient.login(process.env.BOT_TOKEN);
