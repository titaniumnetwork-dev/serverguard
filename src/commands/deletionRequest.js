import { EmbedBuilder, MessageActionRow, MessageButton } from 'discord.js';
import { pendingDeletion } from '../util/db.js';

/** @type {import('./index.js').Command} */
export default {
    data: {
        name: 'deletionrequest',
        description: 'Requests the deletion of the user\'s data',
    },
    async execute(interaction) {
        const confirmationEmbed = new EmbedBuilder()
            .setTitle('Confirmation')
            .setDescription('Are you sure you want to request the deletion of your data?')
            .setColor('#600080');

        const confirmButton = new MessageButton()
            .setCustomId('confirm')
            .setLabel('Yes')
            .setStyle('SUCCESS');

        const denyButton = new MessageButton()
            .setCustomId('deny')
            .setLabel('No')
            .setStyle('DANGER');

        const row = new MessageActionRow().addComponents(confirmButton, denyButton);
        const confirmationMessage = await interaction.reply({ embeds: [confirmationEmbed], components: [row], ephemeral: true });
        const filter = i => i.customId === 'confirm' || i.customId === 'deny';
        const collector = interaction.channel.createMessageComponentCollector({ filter });

        collector.on('collect', async i => {
            if (i.customId === 'confirm') {
                await pendingDeletion(interaction.user.id);
                const successEmbed = new EmbedBuilder()
                    .setTitle('Success!')
                    .setDescription('You have successfully submitted a data deletion request. Note that we process requests on the first of each month.')
                    .setColor('#600080');
                await interaction.editReply({ embeds: [successEmbed], components: [] });
            } else if (i.customId === 'deny') {
                await interaction.editReply({ content: 'Deletion request cancelled.', components: [] });
            }
        });

        collector.on('end', () => {
            if (!confirmationMessage.deleted) {
                confirmationMessage.edit({ components: [] });
            }
        });
    },
};
