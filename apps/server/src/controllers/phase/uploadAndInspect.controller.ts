import { Request, Response } from 'express';
import prisma from '@vercel-clone/db';
import cloneRepo from '../../services/git';
import findBuildableFolders from '../../services/folderScanner';

export default async function uploadAndInspectController(req: Request, res: Response) {
    const { gitUrl, projectName } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            message: 'unauthorized'
        });
    }

    if (!gitUrl || !projectName) {
        return res.status(400).json({
            message: 'gitUrl and projectName are required'
        });
    }

    const project = await prisma.projects.create({
        data: {
            name: projectName,
            gitUrl, userId
        },
    });

    const deployment = await prisma.deployment.create({
        data: {
            projectId: project.id,
            status: 'UPLOADING'
        },
    });

    try {
        const sourcePath = await cloneRepo(gitUrl, deployment.id);
        const folders = await findBuildableFolders(sourcePath);

        await prisma.deployment.update({
            where: {
                id: deployment.id
            },
            data: {
                status: 'AWAITING_CONFIG'
            },
        });

        res.status(200).json({
            deploymentId: deployment.id,
            projectId: project.id,
            folders,
        });
    } catch (err) {
        console.log('inspect error:', err);

        await prisma.deployment.update({
            where: {
                id: deployment.id
            },
            data: {
                status: 'FAILED'
            },
        });

        res.status(500).json({
            message: 'Clone failed'
        });
    }
}