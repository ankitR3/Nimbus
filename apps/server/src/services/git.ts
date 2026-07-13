import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

const TEMP_DIR = path.join(process.cwd(), "tmp");

export default async function cloneRepo(gitUrl: string, deploymentId: string) {
    const targetPath = path.join(TEMP_DIR, deploymentId);
    await fs.mkdir(targetPath, { recursive: true });

    await simpleGit().clone(gitUrl, targetPath);

    return targetPath;
}