import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { jobManager } from '../../src/services/jobManager.js';
import { ExportService } from '../../src/services/exportService.js';
import { ProviderFactory } from '../../src/providers/ProviderFactory.js';

describe('End-to-End API & Engine Integration', () => {
  test('Executes a full People research job with custom fields, deduplication and multi-page pagination', async () => {
    // 1. Initialize job with custom field "fundingStage"
    const jobCreation = jobManager.createJob({
      query: 'CTO startup India',
      limit: 30,
      category: 'people',
      fields: [
        { key: 'name', label: 'Name' },
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'company', label: 'Company' },
        { key: 'location', label: 'Location' },
        { key: 'profileUrl', label: 'Profile URL' },
        { key: 'fundingStage', label: 'Funding Stage', isCustom: true }
      ],
      provider: 'mock'
    });

    assert.ok(jobCreation.jobId);
    assert.equal(jobCreation.status, 'pending');

    // 2. Wait for asynchronous background execution to complete
    let job = jobManager.getJob(jobCreation.jobId);
    let attempts = 0;
    while (['pending', 'in_progress'].includes(job.status) && attempts < 30) {
      await new Promise(r => setTimeout(r, 200));
      job = jobManager.getJob(jobCreation.jobId);
      attempts++;
    }

    assert.equal(job.status, 'completed');
    assert.equal(job.results.length, 30);
    assert.ok(job.metrics.duplicates >= 0);
    assert.ok(job.progress.currentPage >= 2); // Multi-page processed

    // 3. Verify dynamic field projection
    const firstRecord = job.results[0];
    assert.ok(firstRecord.name);
    assert.ok(firstRecord.jobTitle);
    assert.ok(firstRecord.company);
    assert.ok(firstRecord.location);
    assert.ok(firstRecord.profileUrl);
    assert.ok(firstRecord.fundingStage); // Custom field is populated!

    // Ensure unwanted fields are NOT present
    assert.equal(firstRecord.unwantedSecretField, undefined);

    // 4. Test Export Generation
    const csv = await ExportService.exportToCsv(job.results, job.fields);
    assert.ok(csv.length > 500);

    const xlsx = await ExportService.exportToExcel(job.results, job.fields);
    assert.ok(xlsx.length > 1000);

    const json = ExportService.exportToJson(job.results);
    const parsed = JSON.parse(json.toString('utf-8'));
    assert.equal(parsed.recordCount, 30);
  });

  test('Executes a Company research job with dynamic company fields', async () => {
    const jobCreation = jobManager.createJob({
      query: 'FinTech companies India',
      limit: 20,
      category: 'companies',
      fields: [
        { key: 'companyName', label: 'Company Name' },
        { key: 'companyUrl', label: 'Company URL' },
        { key: 'industry', label: 'Industry' },
        { key: 'employeeCount', label: 'Employee Count' },
        { key: 'website', label: 'Website' }
      ],
      provider: 'mock'
    });

    let job = jobManager.getJob(jobCreation.jobId);
    let attempts = 0;
    while (['pending', 'in_progress'].includes(job.status) && attempts < 30) {
      await new Promise(r => setTimeout(r, 200));
      job = jobManager.getJob(jobCreation.jobId);
      attempts++;
    }

    assert.equal(job.status, 'completed');
    assert.equal(job.results.length, 20);

    const sample = job.results[0];
    assert.ok(sample.companyName);
    assert.ok(sample.companyUrl);
    assert.ok(sample.industry);
    assert.ok(sample.employeeCount);
    assert.ok(sample.website);
  });

  test('Real provider job safely terminates and refuses to fake data when unconfigured', async () => {
    const jobCreation = jobManager.createJob({
      query: 'CTO startup India',
      limit: 25,
      category: 'people',
      fields: [{ key: 'name', label: 'Name' }],
      provider: 'real'
    });

    let job = jobManager.getJob(jobCreation.jobId);
    let attempts = 0;
    while (['pending', 'in_progress'].includes(job.status) && attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      job = jobManager.getJob(jobCreation.jobId);
      attempts++;
    }

    assert.equal(job.status, 'failed');
    assert.equal(job.results.length, 0); // Strictly zero fake records
    assert.ok(job.error.includes('Real data provider is not configured'));
  });
});
