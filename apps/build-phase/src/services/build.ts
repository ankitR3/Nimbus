import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function runBuild(sourcePath: string) {
    await execAsync("npm install", { cwd: sourcePath });
    await execAsync("npm run build", { cwd: sourcePath });
}