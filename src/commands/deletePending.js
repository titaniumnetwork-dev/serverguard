import { EmbedBuilder } from 'discord.js';
import { deletePending } from '../util/db.js';

/** @type {import('./index.js').Command} */
export default {
    data: {
        name: 'deletepending',
        description: 'Deletes all entries that are pending deletion.',
    },
    async execute(interaction) {
        const result = await deletePending();
        for (const id of result) {
            if (await interaction.guild.members.fetch(id[0]).catch(err => false)) {
                const member = await interaction.guild.members.fetch(id[0]);
                if (member.roles.cache.some(role => role.id === process.env.ROLE_ID)) {
                    member.roles.remove(process.env.ROLE_ID);
                    console.log('Removed role from ' + id[0]);
                }
            }
            else {
                console.log(id[0] + ' is not in the discord');
            }
        }
        const embed = new EmbedBuilder()
            .setTitle('Data deletion requests have been processed.')
            .setDescription(`All users that have requested deletion of their data have been cleared from the database and their roles removed. We have processed ${result.length} requests.`)
            .setColor('#600080');
        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};
