import express from 'express';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get current user's notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications.', error: error.message });
  }
});

// Mark a notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await prisma.notification.update({
      where: { id, userId: req.user.userId },
      data: { isRead: true },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read.', error: error.message });
  }
});

export default router;
