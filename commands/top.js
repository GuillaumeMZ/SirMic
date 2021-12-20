const { MessageActionRow, MessageButton } = require('discord.js');

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

    async execute(interaction, _) {
        const result = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setLabel('Consulter le classement')
                                .setStyle('LINK')
                                .setURL('https://www.perdu.com')
                        );
        
        await interaction.reply({
            content: 'Cliquez sur le bouton pour consulter le classement !',
            components : [result]
        });
    }
}

module.exports = {
    TopCommand: TopCommand
};