import express from 'express';
import { exportJobResults } from '../controllers/exportController.js';

const router = express.Router();

router.get('/:id/export/:format', exportJobResults);

export default router;
