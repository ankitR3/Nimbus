import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import githubWebhoook from '../controllers/phase/webhook.controller';
import confirmDeploymentController from '../controllers/phase/confirmDeployment.controller';
import uploadAndInspectController from '../controllers/phase/uploadAndInspect.controller';
const router: Router = Router();

router.post('/github', githubWebhoook);
router.post('/inspect', authMiddleware, uploadAndInspectController);
router.post('/confirm', authMiddleware, confirmDeploymentController);

export default router;