import express from 'express';
import {
  createJob,
  getJobStatus,
  streamJobEvents,
  cancelJob,
  listJobs,
  getProviders
} from '../controllers/jobController.js';

const router = express.Router();

router.get('/providers', getProviders);
router.get('/', listJobs);
router.post('/', createJob);
router.get('/:id', getJobStatus);
router.get('/:id/events', streamJobEvents);
router.post('/:id/cancel', cancelJob);

export default router;
