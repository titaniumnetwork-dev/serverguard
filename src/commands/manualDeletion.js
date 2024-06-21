import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { deleteData } from '../util/db.js';

/** @type {import('./index.js').Command} */
export default {
    data: new SlashCommandBuilder()
    .setName('manualdeletion')
    .setDescription('Manually deletes a user\'s data from the database.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to earase from the DB')
        .setRequired(true),
    ),
    async execute(interaction) {
        const user = interaction.options.getMember('user').id;
        await deleteData(user)
            .then(async () => {
                const member = await interaction.guild.members.fetch(user);
                if (member.roles.cache.some(role => role.id === process.env.ROLE_ID)) {
                    member.roles.remove(process.env.ROLE_ID);
                    console.log('Removed role from ' + user);
                }
                const embed = new EmbedBuilder()
                    .setTitle('Manual Data Deletion Request Processed.')
                    .setDescription(`<@${user}> has been deleted from the database successfully.`)
                    .setColor('#600080');    
                interaction.reply({ embeds: [embed], ephemeral: false});
            })
            .catch((err) => {
                interaction.reply({ content: 'An error occurred while deleting user data.', ephemeral: true });
            });
    },
};
