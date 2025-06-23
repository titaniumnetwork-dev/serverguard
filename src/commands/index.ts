import type { StructurePredicate } from "../util/loaders.ts";
import type {
	RESTPostAPIApplicationCommandsJSONBody,
	CommandInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	ChatInputCommandInteraction,
} from "discord.js";

export interface Command {
	data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<any> | any;
}

export const predicate: StructurePredicate<Command> = (structure) =>
	Boolean(structure) &&
	typeof structure === "object" &&
	"data" in structure &&
	"execute" in structure &&
	typeof structure.data === "function" &&
	typeof structure.execute === "function";
