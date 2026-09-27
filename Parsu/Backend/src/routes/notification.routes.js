import { Router } from 'express';
import { authUser } from '../middlewares/auth.middleware.js';
import {
    subscribePush,
    unsubscribePush,
    testPushNotification,
    getPendingNotifications
} from '../controllers/notification.controller.js';

const router = Router();
router.use(authUser);

router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);
router.post('/test', testPushNotification);
router.get('/pending', getPendingNotifications);

export default router;
