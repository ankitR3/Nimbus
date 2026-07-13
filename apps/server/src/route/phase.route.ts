import { Router } from 'express';
import uploadController from '../controllers/phase/upload.controller';
import authMiddleware from '../middleware/authMiddleware';

const router: Router = Router();

router.post('/upload', authMiddleware, uploadController);

export default router;