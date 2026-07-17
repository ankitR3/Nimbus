import fs from 'fs/promises';
import path from 'path';

export default async function findBuildableFolders(rootPath: string): Promise<string[]> {
    const results: string[] = [];

    async function scan(currentPath: string, relativePath: string, depth: number) {
        if (depth > 3) return; // don't recurse forever into deeply nested folders

        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        const hasPackageJson = entries.some(e => e.isFile() && e.name === 'package.json');
        if (hasPackageJson && relativePath !== '') {
            results.push(relativePath);
        }

        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                const nextPath = path.join(currentPath, entry.name);
                const nextRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                await scan(nextPath, nextRelative, depth + 1);
            }
        }
    }

    // Check if the root itself has a package.json too
    const rootEntries = await fs.readdir(rootPath, { withFileTypes: true });
    const rootHasPackageJson = rootEntries.some(e => e.isFile() && e.name === 'package.json');
    if (rootHasPackageJson) {
        results.push('');
    }

    await scan(rootPath, '', 0);

    return results;
}