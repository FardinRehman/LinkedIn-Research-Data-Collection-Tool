import express from 'express';
import { getJobResults, getJobFailedRecords } from '../controllers/resultController.js';

const router = express.Router();

router.get('/:id/results', getJobResults);
router.get('/:id/failed-records', getJobFailedRecords);

export default router;
