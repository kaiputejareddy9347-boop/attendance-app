import express from 'express';
import prisma from '../db.js';

const router = express.Router();

// GET active college configuration
router.get('/config', async (req, res) => {
  try {
    let config = await prisma.collegeConfig.findFirst();
    if (!config) {
      // Create a default if none exists
      config = await prisma.collegeConfig.create({
        data: {
          name: 'City Technological University',
          code: 'CTU',
          logoUrl: '',
          academicYear: '2026-2027',
        },
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching college config.', error: error.message });
  }
});

export default router;
