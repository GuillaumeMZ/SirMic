require('dotenv').config();
const { Client : DiscordClient, Intents, MessageEmbed } = require('discord.js');
const { Client : PostgresClient } = require('pg');

const discordClient = new DiscordClient({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
const EMBED_COLOR = 0x206694;

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

sqlConnection.connect()
    .then(result => {
        sqlConnection.query('SELECT NOW()')
            .then(result2 => console.log(result2))
            .catch(err2 => console.log(err2))
    })
    .catch(err => console.log(err));

function changeBotStatus(){
    discordClient.user.setPresence({activities: [{name: getRandomStatus()}]});
}

function getRandomStatus(){
    return botStatuses[Math.round(Math.random()*botStatuses.length)];
}

function canMemberEarnXp(member, channel){ //TODO merge filters when it's done
    return channel.filter(user => user.id != member.id)
                  .filter(user => !user.user.bot)
                  .filter(user => !user.voice.selfMute && !user.voice.selfDeaf)
                  .size != 0;
}

function updateMemberXp(guildId, memberId){
    const getLevelQuery = `SELECT lastlevel FROM guild_${guildId} WHERE id='${memberId}'`;
    
    sqlConnection.query(getLevelQuery)
        .then(result =>{
            const currentLevel = result.rows[0].lastlevel;
            sqlConnection.query(`CALL UpdateMemberXp(${guildId}, ${memberId})`)
                .then(result2 =>{
                    sqlConnection.query(getLevelQuery)
                        .then(result3 => {
                            const newLevel = result3.rows[0].lastlevel;
                            if(newLevel > currentLevel){
                                //Envoyer un message
                            }
                        })
                        .catch(error3 =>{
                            console.log(error3);
                        });
                })
                .catch(error2 =>{
                    console.log(error2);
                });
        })
        .catch(error =>{
            console.log(error);
        });
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
    let commands = guild.commands;

    commands.create({
        name: 'rank',
        description: 'Retrieves the rank of a user (if not specified, retrieves the rank of the caller)',
        options: [{
            name: 'user',
            description: 'The user to get the rank to',
            required: false,
            type: 6 //User
        }]
    });
});

discordClient.on('interactionCreate', async (interaction) => {
    if(!interaction.isCommand()) return;

    const {commandName, options} = interaction;
    
    if(commandName === 'rank'){
        const targetUser = options.getUser('user') != null ? options.getUser('user') : interaction.user;

        sqlConnection.query(`WITH users AS (SELECT id, name, xp, lastlevel, RANK() OVER (ORDER BY xp DESC) rank FROM guild_${interaction.guildId}) SELECT name, xp, lastlevel, rank FROM users WHERE id='${targetUser.id}'`)
            .then(result => {
                const resultEmbed = new MessageEmbed()
                    .setTitle(`**${targetUser.username}'s ranking:**`)
                    .setColor(EMBED_COLOR)
                    .setAuthor(`${targetUser.username}`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        {name: 'Rank:', value: `#${result.rows[0].rank}`},
                        {name: 'Level:', value: `${result.rows[0].lastlevel}`},
                        {name: 'XP:', value: `${result.rows[0].xp}`}
                    )
                    .setFooter('Bot made by DefectiveTurret#6250 !');
                interaction.reply({
                    embeds: [resultEmbed],
                });
            })
            .catch(error => {
                console.log(error);
            });
        
    } else if(commandName === 'top'){
        const guildId = interaction.guildId;
        sqlConnection.query(`SELECT name, xp, lastlevel, RANK() OVER (ORDER BY xp DESC) rank FROM guild_${guildId})`)
            .then(_ => {
                const resultEmbed = new MessageEmbed()
                    .setTitle(`**${interaction.guild.name}'s ranking:**`)
                    .setDescription('')
                    .setColor(EMBED_COLOR)
                    .setFooter('Bot made by DefectiveTurret#6250 !');
                interaction.reply({
                    embeds: [resultEmbed]
                });
            })
            .catch(error => {
                console.log(error);
            }); 
    }
});

discordClient.on('guildCreate', guild => {
    sqlConnection.query(`CALL RegisterNewGuild(${guild.id})`);
});

discordClient.on('voiceStateUpdate', (oldState, newState) => {
    if(oldState.member.user.bot || newState == null) return;

    sqlConnection.query(`CALL CheckUserExistence(${oldState.guild.id}, ${oldState.member.user.id})`);
});

/*discordClient.on('ready', () => {
    setInterval(() => {
        changeBotStatus();
    }, 10000);

    setInterval(() => {
        updateMembersXp();
    }, 60000);
});*/

discordClient.login(process.env.BOT_TOKEN);
