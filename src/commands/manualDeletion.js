import { Colors, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { deleteData } from '../util/db.js';

/** @type {import('./index.js').Command} */
export default {
    data: new SlashCommandBuilder()
    .setName('manualdeletion')
    .setDescription('Manually deletes a user\'s data from the database.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to erase from the DB')
        .setRequired(true),
    ),
    async execute(interaction) {
        console.log(interaction.options.get("user").value)
        let user = interaction.options.getMember('user')
        if (!user) {
            user = interaction.client.users.fetch(interaction.options.get("user").value)
            if (!user){
                const embed = new EmbedBuilder()
                .setTitle('Not found')
                .setDescription(`<@${user}> does not exist.`)
                .setColor(Colors.Red);
                return await interaction.reply({ embeds: [embed], ephemeral: false});
            }
            await deleteData(user.id).then(async () => {
                const embed = new EmbedBuilder()
                .setTitle('Manual Data Deletion Request Processed.')
                .setDescription(`<@${user.id}> has been deleted from the database successfully.`)
                .setColor('#600080');    
            return await interaction.reply({ embeds: [embed], ephemeral: false});
            })
        }
        await deleteData(user.id).then(async () => {
            const member = await interaction.guild.members.fetch(user);
            if (member.roles.cache.some(role => role.id === process.env.ROLE_ID)) {
                member.roles.remove(process.env.ROLE_ID);
                console.log('Removed role from ' + user);
            }
            const embed = new EmbedBuilder()
                .setTitle('Manual Data Deletion Request Processed.')
                .setDescription(`<@${user.id}> has been deleted from the database successfully.`)
                .setColor('#600080');    
            await interaction.reply({ embeds: [embed], ephemeral: false});
        })
    },
};
