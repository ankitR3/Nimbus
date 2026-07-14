import path from 'path';
import fs from 'fs/promises';

export async function moveOutput(sourcePath: string, outputPath: string) {
    const distPath = path.join(sourcePath, 'dist');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.rename(distPath, outputPath);
}

export async function cleanupSource(sourcePath: string) {
    await fs.rm(sourcePath, { recursive: true, force: true });
}