import { Request, Response } from 'express';
import prisma from '@vercel-clone/db';
import cloneRepo from '../../services/git';
import { pushToQueue } from '../../redis/redisQueue';

function verifyGithubSignature(req: Request): boolean {
    const signature = req.headers['x-hub-signature-256'] as string;
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!signature || !secret) {
        return false;
    }

    const expected = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

        return signature === expected;
    }

    export default async function githubWebhoook(req: Request, res: Response) {
        if (!verifyGithubSignature(req)) {
            return res.status(401).json({
                message: 'Invalid signature'
            });
        }

        const payload = req.body;
        const gitUrl = payload?.repository?.clone_url;

        if (!gitUrl) {
            return res.status(400).json({
                message: 'No repository URL in payload'
            });
        }

        const project = await prisma.projects.findFirst({
            where: {
                gitUrl
            },
        });

        if (!project) {
            return res.status(200).json({
                message: 'No matching project, ignoring'
            });
        }

        const deployment = await prisma.deployment.create({
            data: {
                projectId: project.id,
                status: 'UPLOADING'
            },
        });

        try {
            await cloneRepo(gitUrl, deployment.id);

            await prisma.deployment.update({
                where: {
                    id: deployment.id
                },
                data: {
                    status: 'QUEUED'
                },
            });

            await pushToQueue(deployment.id);

            res.status(202).json({
                message: 'Redeploy triggered',
                deploymentId: deployment.id,
            });
        } catch (err) {
            console.log('webhook redeploy error:', err);

            await prisma.deployment.update({
                where: {
                    id: deployment.id
                },
                data: {
                    status: 'FAILED'
                },
            });

            res.status(500).json({
                message: 'Redeploy failed'
            });
        }
    }