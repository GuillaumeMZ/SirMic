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

        const result = await sqlConnection.query(`WITH users AS (SELECT idserver, iduser, userxp, GetUserLevel(idserver, iduser) AS level, RANK() OVER (ORDER BY userxp DESC) rank FROM levels WHERE idserver = ${interaction.guildId}) SELECT iduser, userxp, level, rank FROM users WHERE iduser = ${targetUser.id}`);
        
        const resultEmbed = new MessageEmbed()
            .setTitle(`**${targetUser.username}'s ranking:**`)
            .setColor(EMBED_COLOR)
            .setAuthor(`${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                {name: 'Rank:', value: `#${result.rows[0].rank}`},
                {name: 'Level:', value: `${result.rows[0].level}`},
                {name: 'XP:', value: `${result.rows[0].userxp}`}
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