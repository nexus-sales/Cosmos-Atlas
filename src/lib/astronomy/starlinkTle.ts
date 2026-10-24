export function limitTleCatalog(text: string, maxSatellites = 1200) {
    const lines = text.split(/\r?\n/).map((line) => line.trimEnd()).filter(Boolean);
    const output: string[] = [];
    for (let index = 0; index + 2 < lines.length && output.length < maxSatellites * 3; index += 3) {
        if (!lines[index + 1].startsWith('1 ') || !lines[index + 2].startsWith('2 ')) continue;
        output.push(lines[index], lines[index + 1], lines[index + 2]);
    }
    if (output.length < 6) throw new Error('Response does not contain valid 3-line TLE records');
    return `${output.join('\n')}\n`;
}
