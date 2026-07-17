import { Request, Response } from 'express';
import prisma from '@vercel-clone/db';
import { pushToQueue } from '../../redis/redisQueue';

export default async function confirmDeploymentController(req: Request, res: Response) {
    try {
    const { deploymentId, rootDirectory } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            message: 'unauthorized'
        });
    }

    if (!deploymentId) {
        return res.status(400).json({
            message: 'deploymentId is required'
        });
    }

    const deployment = await prisma.deployment.findUnique({
        where: {
            id: deploymentId
        },
        include: {
            project: true
        },
    });

    if (!deployment) {
        return res.status(404).json({
            message: 'Deployment not found'
        });
    }

    if (deployment.project.userId !== userId) {
        return res.status(403).json({
            message: 'Forbidden'
        });
    }

    if (deployment.status !== 'AWAITING_CONFIG') {
        return res.status(400).json({
            message: `Cannot confirm a deployment with status ${deployment.status}`
        });
    }

    await prisma.projects.update({
        where: {
            id: deployment.projectId
        },
        data: {
            rootDirectory: rootDirectory || null
        },
    });

    await prisma.deployment.update({
        where: {
            id: deploymentId
        },
        data: {
            status: 'QUEUED'
        },
    });

    await pushToQueue(deploymentId);

    res.status(202).json({
        deploymentId,
        status: 'QUEUED',
    });
    } catch (err) {
        console.log('confirm-controller error', err);
        return res.status(500).json({
            message: 'Error while confirming'
        });
    }
}