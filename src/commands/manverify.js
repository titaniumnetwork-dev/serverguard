import { EmbedBuilder } from 'discord.js';

/** @type {import('./index.js').Command} */
export default {
    data: {
        name: 'manualverify',
        description: 'Manually verifies a user',
        dm_permission: false,
    },
    async execute(interaction, userid) {
        await userid.roles.add(process.env.ROLE_ID);
        const embed = new EmbedBuilder()
            .setTitle('Manual Verification Succeeded')
            .setDescription(`Successfully verified: ${userid}`)
            .setColor('#600080');
        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};
