import { jobManager } from '../services/jobManager.js';
import { ExportService } from '../services/exportService.js';
import { ValidationError } from '../utils/errors.js';

export const exportJobResults = async (req, res, next) => {
  try {
    const { id, format } = req.params;
    const job = jobManager.getJob(id);

    if (!job.results || job.results.length === 0) {
      throw new ValidationError('Job has no collected records to export');
    }

    const sanitizedFilename = `linkedin_research_${job.id}_${Date.now()}`;

    switch ((format || '').toLowerCase()) {
      case 'csv': {
        const csvBuffer = await ExportService.exportToCsv(job.results, job.fields);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.csv"`);
        return res.send(csvBuffer);
      }

      case 'xlsx':
      case 'excel': {
        const xlsxBuffer = await ExportService.exportToExcel(job.results, job.fields, {
          query: job.query,
          collectedCount: job.results.length
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.xlsx"`);
        return res.send(xlsxBuffer);
      }

      case 'json': {
        const jsonBuffer = ExportService.exportToJson(job.results, {
          jobId: job.id,
          query: job.query,
          fields: job.fields,
          metrics: job.metrics
        });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.json"`);
        return res.send(jsonBuffer);
      }

      default:
        throw new ValidationError(`Unsupported export format "${format}". Supported formats: csv, xlsx, json`);
    }
  } catch (error) {
    next(error);
  }
};
