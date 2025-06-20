import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
/** @type {import('./index.js').Command} */
export default {
  data: {
    name: 'verifybutton',
    description:
      'Deploy the button which connects the user to the verification site',
  },
  async execute(interaction) {
    const messageEmbed = new EmbedBuilder()
      .setTitle('Verify with this server')
      .setDescription(
        'In order to gain access to this server, we require verification in order to prevent alting.',
      )
      .setColor('#600080');

    const button = new ButtonBuilder()
      .setLabel('Verify now!')
      .setURL(`${process.env.DOMAIN}/login`)
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      embeds: [messageEmbed],
      components: [row],
    });
  },
};
