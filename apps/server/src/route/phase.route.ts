import { Router } from 'express';
import uploadController from '../controllers/phase/upload.controller';
import authMiddleware from '../middleware/authMiddleware';
import githubWebhoook from '../controllers/phase/webhook.controller';

const router: Router = Router();

router.post('/upload', authMiddleware, uploadController);
router.post('/github', githubWebhoook);

export default router;