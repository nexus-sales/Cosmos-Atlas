import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Patterns of common mojibake sequences (corrupted UTF-8).
 */
const MOJIBAKE_PATTERNS = [
    /ÃƒÂ/g, // Corrupted 'ú' or others
    /Ã¢â‚¬â€/g, // Corrupted '—'
    /Ãƒ/g, // Common start of mojibake
    /â€/g, // Corrupted dash
    /âœ/g, // Corrupted checkmark
    /ðŸ/g, // Corrupted emoji
    /Â/g, // Corrupted non-breaking space or others
];

function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
    const files = readdirSync(dirPath);
    files.forEach((file) => {
        const filePath = join(dirPath, file);
        if (statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                getAllFiles(filePath, fileList);
            }
        } else {
            if (/\.(ts|tsx|js|jsx|json|md|txt)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

describe('Encoding Integrity (Mojibake Prevention)', () => {
    const srcFiles = getAllFiles(join(process.cwd(), 'src'));
    const scriptFiles = getAllFiles(join(process.cwd(), 'scripts'));
    const allFiles = [...srcFiles, ...scriptFiles].filter(f => !f.endsWith('encoding.test.ts'));

    it.each(allFiles)('should not contain mojibake patterns: %s', (filePath) => {
        const content = readFileSync(filePath, 'utf-8');
        MOJIBAKE_PATTERNS.forEach((pattern) => {
            const match = content.match(pattern);
            if (match) {
                const lineIndex = content.substring(0, match.index!).split('\n').length;
                throw new Error(`Mojibake pattern ${pattern} found in ${filePath} at line ${lineIndex}: "${match[0]}"`);
            }
        });
    });

    it('should have correct UTF-8 planet names in constants', () => {
        const planetConstantsPath = join(process.cwd(), 'src/lib/constants/planets.ts');
        const content = readFileSync(planetConstantsPath, 'utf-8');
        expect(content).toContain('Júpiter');
        expect(content).not.toContain('Ã');
    });
});
