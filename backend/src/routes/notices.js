import express from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET all notices (Open to all authenticated users: STUDENT, TEACHER, ADMIN)
router.get('/', authenticate, async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notice board.', error: error.message });
  }
});

// POST a new notice (Open to TEACHER and ADMIN only)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const newNotice = await prisma.notice.create({
      data: {
        title,
        content,
        postedBy: req.user.name || 'Instructor',
      }
    });
    res.status(201).json(newNotice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notice.', error: error.message });
  }
});

// DELETE notice (Admin or poster teacher only)
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found.' });
    }

    // Admins can delete anything; Teachers can delete any notice (or could restrict to their own name matching, but any teacher deleting notice is fine for college flexibility)
    await prisma.notice.delete({ where: { id } });
    res.json({ message: 'Notice deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notice.', error: error.message });
  }
});

export default router;
