import { jobManager } from '../services/jobManager.js';

export const getJobResults = (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const search = (req.query.search || '').trim().toLowerCase();

    const job = jobManager.getJob(id);

    let filtered = job.results;

    // Optional quick search across record values
    if (search) {
      filtered = filtered.filter(item => {
        return Object.values(item).some(val =>
          val && val.toString().toLowerCase().includes(search)
        );
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        jobId: job.id,
        query: job.query,
        status: job.status,
        fields: job.fields,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        metrics: job.metrics,
        records: paginatedData
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getJobFailedRecords = (req, res, next) => {
  try {
    const { id } = req.params;
    const job = jobManager.getJob(id);
    res.json({
      success: true,
      data: {
        jobId: job.id,
        totalFailed: job.failedItems.length,
        items: job.failedItems
      }
    });
  } catch (error) {
    next(error);
  }
};
