import { Router } from 'express';
import { redirectToOriginal } from '../controllers/redirectController.js';

const router = Router();

// Public. This is the route visitors hit when they click a short link.
router.get('/:code', redirectToOriginal);

export default router;
