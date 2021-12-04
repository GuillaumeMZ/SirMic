const EMBED_COLOR = 0x206694;
const TOP_LINK = 'https://www.jexistepasencore.sirmic.zebi';

class TopCommand {
    constructor() {
        this.commandName = 'top';
    }

    create(commandManager) {
        commandManager.create({
            name: 'top',
            description: 'Retrieves the ranking of the most active users of the server',
        });
    }

    async execute(interaction, sqlConnection) {
        const guildId = interaction.guildId;
        interaction.reply(TOP_LINK);
    }
}

module.exports = {
    TopCommand: TopCommand
};