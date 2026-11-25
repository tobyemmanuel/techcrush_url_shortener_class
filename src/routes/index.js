import { Router } from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import urlRoutes from './urlRoutes.js';

/** Everything mounted here lives under /api/v1 (see app.js). */
const router = Router();

router.use('/auth', authRoutes);
router.use('/urls', urlRoutes);
router.use('/admin', adminRoutes);

export default router;
