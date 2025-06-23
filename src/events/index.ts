import type { StructurePredicate } from "../util/loaders";
import type { ClientEvents } from "discord.js";

export interface Event<T extends keyof ClientEvents = keyof ClientEvents> {
	/** The name of the event to listen to */
	name: T;

	/** The function to execute the command */
	execute: (...parameters: ClientEvents[T]) => Promise<void> | void;

	/** Whether or not the event should only be listened to once */
	once?: boolean;
}

export const predicate: StructurePredicate<Event> = (structure) =>
	Boolean(structure) &&
	typeof structure === "object" &&
	"name" in structure &&
	"execute" in structure &&
	typeof structure.name === "string" &&
	typeof structure.execute === "function";
