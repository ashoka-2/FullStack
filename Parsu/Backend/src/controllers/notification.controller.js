import webpush from 'web-push';
import PushSubscription from '../models/pushSubscription.model.js';

// ─── Lazy VAPID initialisation ────────────────────────────────────────────────
// Called the first time a push needs to be sent. Skipped (gracefully) if no
// VAPID keys are configured, so the server still boots without them.
let vapidReady = false;

function initVapid() {
    if (vapidReady) return true;

    const pub  = process.env.VAPID_PUBLIC_KEY?.trim();
    const priv = process.env.VAPID_PRIVATE_KEY?.trim();
    const mail = process.env.VAPID_EMAIL?.trim() || 'admin@parsuai.com';

    if (!pub || !priv) {
        console.warn('[Push] VAPID keys not set — push notifications disabled. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env');
        return false;
    }

    try {
        webpush.setVapidDetails(`mailto:${mail}`, pub, priv);
        vapidReady = true;
        console.log('[Push] VAPID initialised ✓');
        return true;
    } catch (err) {
        console.error('[Push] Failed to set VAPID details:', err.message);
        return false;
    }
}

// ─── Subscribe / Upsert Push Endpoint ────────────────────────────────────────
export async function subscribePush(req, res) {
    try {
        const { subscription } = req.body;
        if (!subscription?.endpoint) {
            return res.status(400).json({ success: false, message: 'Invalid subscription object' });
        }

        await PushSubscription.findOneAndUpdate(
            { user: req.user.id, endpoint: subscription.endpoint },
            { user: req.user.id, subscription, endpoint: subscription.endpoint, updatedAt: new Date() },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        res.json({ success: true, message: 'Push subscription registered' });
    } catch (err) {
        console.error('[Push] Subscribe error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to register push subscription' });
    }
}

// ─── Unsubscribe ──────────────────────────────────────────────────────────────
export async function unsubscribePush(req, res) {
    try {
        const { endpoint } = req.body;
        await PushSubscription.deleteOne({ user: req.user.id, endpoint });
        res.json({ success: true, message: 'Push subscription removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to remove subscription' });
    }
}

// ─── Send push notification to a specific user (all their subscriptions) ─────
export async function sendPushToUser(userId, payload) {
    if (!initVapid()) return 0; // silently skip if no VAPID keys

    try {
        const subs = await PushSubscription.find({ user: userId });
        if (!subs.length) return 0;

        const results = await Promise.allSettled(
            subs.map(s =>
                webpush.sendNotification(s.subscription, JSON.stringify(payload)).catch(async err => {
                    // Remove expired / invalid subscriptions automatically
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await PushSubscription.deleteOne({ _id: s._id });
                    }
                    throw err;
                })
            )
        );
        return results.filter(r => r.status === 'fulfilled').length;
    } catch (err) {
        console.error('[Push] sendPushToUser error:', err.message);
        return 0;
    }
}

// ─── REST endpoint — send a test push to the authenticated user ───────────────
export async function testPushNotification(req, res) {
    if (!initVapid()) {
        return res.status(503).json({ success: false, message: 'Push notifications not configured (no VAPID keys)' });
    }
    try {
        const sent = await sendPushToUser(req.user.id, {
            title: 'Parsu AI',
            body: 'Push notifications are working!',
            tag: 'parsu-test',
            url: '/settings/devices'
        });
        res.json({ success: true, message: `Sent to ${sent} subscription(s)` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Get pending notifications (for SW background fetch) ─────────────────────
export async function getPendingNotifications(req, res) {
    // Extend later with a real persisted Notification model
    res.json({ success: true, notifications: [] });
}
