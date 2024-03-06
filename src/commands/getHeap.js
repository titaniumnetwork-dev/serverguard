import { generateHeapSnapshot } from 'bun';

/** @type {import('./index.js').Command} */
export default {
    data: {
        name: 'getheap',
        description: 'get the heap',
    },
    async execute(interaction) {
        const snapshot = generateHeapSnapshot();
        await Bun.write("heap.json", JSON.stringify(snapshot, null, 2));
        await interaction.reply('done');
    },
};
