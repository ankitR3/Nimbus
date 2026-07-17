import prisma from '@vercel-clone/db';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createSession } from '../../redis/redisSession';

export default async function loginController(req: Request, res: Response) {
    const { user } = req.body;

    if (!user.email) {
        return res.status(400).json({
            message: 'user email required'
        });
    }

    try {
        let myUser = await prisma.user.findUnique({
            where: {
                email: user.email
            }
        });

        if (!myUser) {
            myUser = await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email
                }
            });
        } else {
            myUser = await prisma.user.update({
                where: {
                    email: user.email
                },
                data: {
                    name: user.name,
                    image: user.image
                }
            });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                message: 'JWT_SECRET is missing'
            });
        }

        const token = jwt.sign(
            {
                id: myUser.id,
                email: myUser.email
            },
            secret,
            {
                expiresIn: '7d'
            }
        );

        await createSession(myUser.id, token);

        return res.status(200).json({
            success: true,
            user: myUser,
            token,
        });
    } catch (err) {
        console.log('login error: ', err);
        return res.status(500).json({
            message: 'authentication failed'
        });
    }
}