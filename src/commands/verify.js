import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from "discord.js";
import db from "../util/db.js";

/** @type {import('./index.js').Command} */
export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify a user or IP and grant verified permissions")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Verify a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to verify")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ip")
        .setDescription("Verify an IP address")
        .addStringOption((option) =>
          option
            .setName("ip")
            .setDescription("The IP address to verify")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const guild = interaction.guild;
    const verifiedRole = guild.roles.cache.find(
      (role) => role.id === process.env.ROLE_ID
    );

    if (!verifiedRole) {
      return interaction.reply({
        content:
          "The verified role could not be found. Please check the role ID in the environment variables.",
        ephemeral: true,
      });
    }

    switch (interaction.options.getSubcommand()) {
      case "user":
        await verifyUser(interaction, verifiedRole);
        break;
      case "ip":
        await verifyIP(interaction, verifiedRole);
        break;
      default:
        return interaction.reply({
          content: "Invalid subcommand.",
          ephemeral: true,
        });
    }
  },
};

async function verifyUser(interaction, verifiedRole) {
  const targetUser = interaction.options.getUser("user");
  const guild = interaction.guild;
  const member = await guild.members.fetch(targetUser.id);

  if (member.roles.cache.has(verifiedRole.id)) {
    return interaction.reply({
      content: `${targetUser.username} is already verified.`,
      ephemeral: true,
    });
  }

  await member.roles.add(verifiedRole);

  return interaction.reply({
    content: `${targetUser.username} has been verified and granted the ${verifiedRole.name} role.`,
    ephemeral: true,
  });
}

async function verifyIP(interaction, verifiedRole) {
  const ipAddress = interaction.options.getString("ip");
  const guild = interaction.guild;
  const targetUser = interaction.user;

  const mainId = await db.checkIp(ipAddress);
  if (mainId && mainId !== targetUser.id) {
    return interaction.reply({
      content: `This IP is associated with another user: <@!${mainId}>. Cannot verify this IP.`,
      ephemeral: true,
    });
  }

  const member = await guild.members.fetch(targetUser.id);

  if (member.roles.cache.has(verifiedRole.id)) {
    return interaction.reply({
      content: `${targetUser.username} is already verified.`,
      ephemeral: true,
    });
  }

  await db.setData(targetUser.id, ipAddress);
  await member.roles.add(verifiedRole);

  return interaction.reply({
    content: `${targetUser.username} has been verified and granted the ${verifiedRole.name} role.`,
    ephemeral: true,
  });
}
