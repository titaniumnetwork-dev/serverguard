import { EmbedBuilder } from 'discord.js';
import { deleteData } from '../util/db.js';

/** @type {import('./index.js').Command} */
export default {
    data: {
        name: 'manualdeletion',
        description: 'Manually deletes a user\'s data from the database.',
        dm_permission: false,
    },
    async execute(interaction) {
        const user = interaction.options.getMember('user');
        const userId = user.id;
        await deleteData(userId)
            .then(async () => {
                const member = await interaction.guild.members.fetch(userId);
                if (member.roles.cache.some(role => role.id === process.env.ROLE_ID)) {
                    member.roles.remove(process.env.ROLE_ID);
                    console.log('Removed role from ' + userId);
                }
                const embed = new EmbedBuilder()
                    .setTitle('Manual Data Deletion Request Processed.')
                    .setDescription(`<@${userId}> has been deleted from the database successfully.`)
                    .setColor('#600080');    
                interaction.reply({ embeds: [embed], ephemeral: false});
            })
            .catch((err) => {
                interaction.reply({ content: 'An error occurred while deleting user data.', ephemeral: true });
            });
    },
};
