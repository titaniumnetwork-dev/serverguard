import { EmbedBuilder } from "discord.js";
import { pendingDeletion } from "../util/db.js";

/** @type {import('./index.js').Command} */
export default {
  data: {
    name: "deletionrequest",
    description: "Requests the deletion of the user's data",
  },
  async execute(interaction) {
    await pendingDeletion(interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle("Success!")
      .setDescription(
        "You have successfully submitted a data deletion request. Note that we process requests on the first of each month.",
      )
      .setColor("#600080");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
