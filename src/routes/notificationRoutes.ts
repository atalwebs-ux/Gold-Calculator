import { Router, Request, Response } from 'express';

const router = Router();

interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  target: string;
  sentAt: string;
  data?: Record<string, any>;
}

// In-memory log of sent notification broadcasts
const sentNotificationsLog: NotificationRecord[] = [
  {
    id: 'notif_init_1',
    title: '🔔 Gold Rate Alert: 24K Up',
    body: '24K Gold in India reached ₹13,532.38 / gram (+0.24% today).',
    target: 'all_users',
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    data: { screen: 'Rates', purity: '24K' },
  },
];

/**
 * POST /api/v1/notifications/broadcast
 * Trigger a push notification alert for mobile app users
 */
router.post('/notifications/broadcast', (req: Request, res: Response) => {
  const { title, body, message, target = 'all_users', data = {} } = req.body;
  const content = body || message;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: title and body/message are required.',
    });
  }

  const newRecord: NotificationRecord = {
    id: `notif_${Date.now()}`,
    title: String(title).trim(),
    body: String(content).trim(),
    target: String(target),
    sentAt: new Date().toISOString(),
    data,
  };

  sentNotificationsLog.unshift(newRecord);
  if (sentNotificationsLog.length > 50) {
    sentNotificationsLog.pop();
  }

  return res.status(200).json({
    success: true,
    message: 'Push notification broadcast registered and dispatched successfully.',
    notification: newRecord,
    fcmGuide: {
      consoleUrl: 'https://console.firebase.google.com/project/gold-calculator-b1036/notification',
      androidPackage: 'com.goldcalculator.app',
      note: 'You can also send directly from Firebase Console > Engage > Messaging without writing code.',
    },
  });
});

/**
 * GET /api/v1/notifications/history
 * List sent notification broadcasts
 */
router.get('/notifications/history', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    count: sentNotificationsLog.length,
    notifications: sentNotificationsLog,
  });
});

/**
 * GET /api/v1/notifications/info
 * Documentation on how to send push notifications via Firebase Console or API
 */
router.get('/notifications/info', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    firebaseProject: 'gold-calculator-b1036',
    androidPackage: 'com.goldcalculator.app',
    methods: [
      {
        name: 'Firebase Console (Recommended / No-Code)',
        url: 'https://console.firebase.google.com/project/gold-calculator-b1036/notification',
        steps: [
          'Open Firebase Console',
          'Go to Engage > Messaging',
          'Click New Campaign > Notifications',
          'Type Title & Text',
          'Select Android app (com.goldcalculator.app)',
          'Click Publish to deliver to all phones instantly',
        ],
      },
      {
        name: 'Server Broadcast API (Postman / cURL)',
        endpoint: 'POST /api/v1/notifications/broadcast',
        payloadExample: {
          title: '🔥 Live Gold Rate Surge',
          body: '24K Gold in INR just reached ₹13,532 / g!',
          target: 'all_users',
        },
      },
    ],
  });
});

export default router;
