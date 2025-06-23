import { readdir, stat } from "node:fs/promises";
import { URL } from "node:url";
import {
	predicate as commandPredicate,
	type Command,
} from "../commands/index.ts";
import { predicate as eventPredicate, type Event } from "../events/index.ts";
import type { PathLike } from "node:fs";

export type StructurePredicate<T> = (structure: Partial<T>) => structure is T;

export async function loadStructures<T>(
	dir: PathLike,
	predicate: StructurePredicate<T>,
	recursive = true
): Promise<T[]> {
	// Get the stats of the directory
	const statDir = await stat(dir);

	// If the provided directory path is not a directory, throw an error
	if (!statDir.isDirectory()) {
		throw new Error(`The directory '${dir}' is not a directory.`);
	}

	// Get all the files in the directory
	const files = await readdir(dir);

	// Create an empty array to store the structures
	/** @type {T[]} */
	const structures = [];

	// Loop through all the files in the directory
	for (const file of files) {
		// If the file is index.js or the file does not end with .js, skip the file
		if (file === "index.ts" || !file.endsWith(".ts")) {
			continue;
		}

		// Get the stats of the file
		const statFile = await stat(new URL(`${dir}/${file}`));

		// If the file is a directory and recursive is true, recursively load the structures in the directory
		if (statFile.isDirectory() && recursive) {
			structures.push(
				...(await loadStructures(`${dir}/${file}`, predicate, recursive))
			);
			continue;
		}
		// Import the structure dynamically from the file
		const structure = (await import(`${dir}/${file}`)).default;
		// If the structure is a valid structure, add it
		if (predicate(structure)) structures.push(structure);
	}

	return structures;
}

export async function loadCommands(
	dir: PathLike,
	recursive: boolean = true
): Promise<Map<string, Command>> {
	const structures = await loadStructures(dir, commandPredicate, recursive);
	return structures.reduce(
		(acc, cur) => acc.set(cur.data.name, cur),
		new Map()
	);
}

export async function loadEvents(
	dir: PathLike,
	recursive: boolean = true
): Promise<Event[]> {
	return loadStructures(dir, eventPredicate, recursive);
}
