import { Job } from 'bullmq';
import prisma from '@vercel-clone/db';
import path from "path";
import { runBuild } from '../services/build.js';
import { moveOutput, cleanupSource } from '../services/fileManager.js';

export async function processDeployment(job: Job) {
    const { deploymentId } = job.data;
    console.log(`Building deployment ${deploymentId}`);

    await prisma.deployment.update({
        where: {
            id: deploymentId
        },
        data: {
            status: "BUILDING"
        },
    });

    const deployment = await prisma.deployment.findUnique({
        where: {
            id: deploymentId
        },
        include: {
            project: true
        },
    });

    const sourcePath = path.join(process.cwd(), "..", "server", "tmp", deploymentId);
    const outputPath = path.join(process.cwd(), "..", "server", "output", deploymentId);

    try {
        await runBuild(sourcePath);
        await moveOutput(sourcePath, outputPath);
        await cleanupSource(sourcePath);

        await prisma.deployment.update({
            where: {
                id: deploymentId
            },
            data: {
                status: "DEPLOYED",
                deploymentUrl: `${deploymentId}.localhost:4000`,
            },
        });

        console.log(`Deployment ${deploymentId} succeeded`);
    } catch (err) {
        console.error(`Deployment ${deploymentId} failed`, err);

        await prisma.deployment.update({
            where: {
                id: deploymentId
            },
            data: {
                status: "FAILED"
            }
        });
    }
}