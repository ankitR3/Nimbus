import { Request, Response } from 'express';
import prisma from '@vercel-clone/db';
import cloneRepo from '../../services/git';
import { pushToQueue } from '../../redis/redisQueue';

export default async function uploadController(req: Request, res: Response) {
    const { gitUrl, projectName, userId } = req.body;

    if (!gitUrl || !projectName || !userId) {
        return res.status(400).json({
            message: 'gitUrl, projectName, and userId are required'
        })
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });

    if (!user) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    const project = await prisma.projects.create({
        data: {
            name: projectName,
            gitUrl,
            userId
        }
    })

    const deployment = await prisma.deployment.create({
        data: {
            projectId: project.id,
            status: 'UPLOADING'
        }
    });

    try {
        await cloneRepo(gitUrl, deployment.id);

        await prisma.deployment.update({
            where: {
                id: deployment.id
            },
            data: {
                status: "QUEUED"
            },
        });

        await pushToQueue(deployment.id);

        res.status(202).json({
            deploymentId: deployment.id,
            status: "QUEUED",
        });
    } catch (err) {
        console.log('upload-phase error: ', err);

        await prisma.deployment.update({
            where: {
                id: deployment.id
            },
            data: {
                status: "FAILED"
            },
        });

        res.status(500).json({
            message: "Clone failed"
        });
    }
}