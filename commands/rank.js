const {MessageEmbed} = require('discord.js');

const EMBED_COLOR = 0x206694;

class RankCommand {
    constructor() {
        this.commandName = 'rank';
    }

    create(commandManager) {
        commandManager.create({
            name: 'rank',
            description: 'Retrieves the rank of a user (if not specified, retrieves the rank of the caller)',
            options: [{
                name: 'user',
                description: 'The user to get the rank to',
                required: false,
                type: 6 //User
            }]
        });
    }

    async execute(interaction, sqlConnection) {
        const options = interaction.options;
        const targetUser = options.getUser('user') ?? interaction.user;

        const result = await sqlConnection.query(`WITH users AS (SELECT id, name, xp, lastlevel, RANK() OVER (ORDER BY xp DESC) rank FROM guild_${interaction.guildId}) SELECT name, xp, lastlevel, rank FROM users WHERE id='${targetUser.id}'`)
        
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
    }
}

module.exports = {
    RankCommand: RankCommand
};