import { Router } from 'express';
import * as urlController from '../controllers/urlController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { ROLES } from '../utils/constants.js';
import { createUrlRules, listUrlsRules, statsRules, updateUrlRules, urlIdRules } from '../utils/validation.js';

const router = Router();

// Every route here needs a logged in user or admin.
router.use(authenticate, authorize(ROLES.USER, ROLES.ADMIN));

router.post('/', validate(createUrlRules), urlController.createUrl);
router.get('/', validate(listUrlsRules), urlController.listUrls);
router.get('/:id', validate(urlIdRules), urlController.getUrl);
router.get('/:id/stats', validate(statsRules), urlController.getUrlStats);
router.patch('/:id', validate(updateUrlRules), urlController.updateUrl);
router.delete('/:id', validate(urlIdRules), urlController.deleteUrl);

export default router;
