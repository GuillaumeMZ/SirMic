require('dotenv').config();
const { Client : DiscordClient, Intents } = require('discord.js');
const { Client : PostgresClient } = require('pg');

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
"être un bot de type acier", "I am mad Bot, it's so cooool, sonuvabitch"];

sqlConnection.connect(err => {
    if(err){
        console.error('Unable to connect to the database.', err.message);
    } else {
        console.log('connected');
    }
});

const getXpFromLevel = (level) => Math.round((1.0141*(level**2.5954))*60);
const getLevelFromXp = (xp) => Math.floor(Math.exp(Math.log(xp/60/1.0141)/2.5954));

function canMemberEarnXp(member, channel){
    return channel.filter(user => user.id != member.id)
                  .filter(user => !user.user.bot)
                  .filter(user => !user.voice.selfMute && !user.voice.selfDeaf)
                  .size != 0;
}

function updateMemberXp(member, guild){

}

function updateMembersXp(){ //TODO change ifs into filter then call each
    discordClient.guilds.cache.each(guild => {
        guild.channels.cache.each(channel => {
            if(!channel.isVoice() || channel.id == guild.afkChannelId) return;

            channel.members.each(member =>{
                if(!canMemberEarnXp(member, channel)) return;
                updateMemberXp(member, guild);
            });
        });
    });
}

discordClient.login(process.env.BOT_TOKEN);
