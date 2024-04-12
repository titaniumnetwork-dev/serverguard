import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from 'discord.js';
import * as db from '../util/db.js';

/** @type {import('./index.js').Command} */
export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify a user and IP address')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to verify')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('ip')
        .setDescription('The IP address to verify')
        .setRequired(true),
    ),
  async execute(interaction) {
    const verifiedRole = interaction.guild.roles.cache.find(
      (role) => role.id === process.env.ROLE_ID,
    );
    if (!verifiedRole) {
      return interaction.reply({
        content:
          'The verified role could not be found. Please check the role ID in the environment variables.',
        ephemeral: true,
      });
    }
    const ip = interaction.options.getString('ip');

    const targetMember = await interaction.guild.members.fetch(
      interaction.options.getUser('user').id,
    );

    const mainId = await db.checkIp(ip);

    if (mainId) {
      return interaction.reply({
        content: `${targetMember.user.globalName}'s IP is already verified as <@!${mainId}>.`,
        ephemeral: true,
      });
    }

    await db.setData(targetMember.id, ip);
    await targetMember.roles.add(verifiedRole);

    return interaction.reply({
      content: `${targetMember.id} has been verified and granted the ${verifiedRole.name} role.`,
      ephemeral: false,
    });
  },
};
