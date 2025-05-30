import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from 'discord.js';
import { grantRole } from '../util/discordManager.js';
import { memberRoles } from '../index.js';
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
    const verifiedRoleNames = [];
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
    const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
    for (const role of memberRoles) {
      const verifiedRole = interaction.guild.roles.cache.find((r) => r.id === role);
      if (!verifiedRole) {
        return interaction.reply({
          content:
            'The verified role could not be found. Please check the role ID in the environment variables.',
          ephemeral: true,
        });
      }
      verifiedRoleNames.push(verifiedRole.name);
    }

    await db.setData(targetMember.id, ip);
    await grantRole(guild, id, memberRoles);

    return interaction.reply({
      content: `${targetMember.id} has been verified and granted the ${formatter.format(verifiedRoleNames)} role${verifiedRoleNames.length > 1 ? "s": ""}.`,
      ephemeral: false,
    });
  },
};
