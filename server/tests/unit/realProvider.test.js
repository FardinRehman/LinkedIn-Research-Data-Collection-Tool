import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LinkedInAuthorizedProvider } from '../../src/providers/LinkedInAuthorizedProvider.js';
import { MockDataProvider } from '../../src/providers/MockDataProvider.js';
import { ProviderFactory } from '../../src/providers/ProviderFactory.js';
import { NormalizationService } from '../../src/services/normalizationService.js';
import { ProviderError } from '../../src/utils/errors.js';

describe('RealLinkedInProvider & Provider Architecture', () => {
  test('Simulation provider remains functional for testing', async () => {
    const simProvider = ProviderFactory.getProvider('simulation', { delayMs: 0 });
    const result = await simProvider.fetchPage({ query: 'CTO startup India', page: 1, pageSize: 5 });
    assert.equal(result.records.length, 5);
    assert.equal(result.hasNextPage, true);
  });

  test('Real provider detects missing credentials and refuses to fake data', async () => {
    const unconfiguredProvider = new LinkedInAuthorizedProvider({ apiKey: '' });
    
    // checkHealth should report not_configured
    const health = await unconfiguredProvider.checkHealth();
    assert.equal(health.available, false);
    assert.equal(health.status, 'not_configured');

    // fetchPage must throw descriptive error and NEVER return fake data
    await assert.rejects(
      async () => {
        await unconfiguredProvider.fetchPage({ query: 'CTO India' });
      },
      (err) => {
        assert.ok(err instanceof ProviderError);
        assert.ok(err.message.includes('Real data provider is not configured'));
        return true;
      }
    );
  });

  test('Real provider normalizer does NOT fabricate missing fields', () => {
    const realProvider = new LinkedInAuthorizedProvider({ apiKey: 'test_key' });
    
    // Raw response with only name and headline from authorized API
    const rawPerson = {
      id: 'urn:li:person:123',
      firstName: { localized: { en_US: 'Ananya' } },
      lastName: { localized: { en_US: 'Verma' } },
      headline: 'CTO at NextGen',
      vanityName: 'ananya-verma-cto'
      // Notice: no company website, no education, no funding stage
    };

    const normalized = realProvider.normalizeRecord(rawPerson, 'people');
    assert.equal(normalized.name, 'Ananya Verma');
    assert.equal(normalized.jobTitle, 'CTO at NextGen');
    assert.equal(normalized.profileUrl, 'https://www.linkedin.com/in/ananya-verma-cto');
    assert.equal(normalized.companyWebsite, null); // Unprovided field is strictly null/empty, not faked
    assert.equal(normalized.education, null);
    assert.equal(normalized.fundingStage, undefined);

    // Test through dynamic field projection
    const requestedFields = [
      { key: 'name', label: 'Name' },
      { key: 'jobTitle', label: 'Job Title' },
      { key: 'companyWebsite', label: 'Company Website' },
      { key: 'fundingStage', label: 'Funding Stage', isCustom: true }
    ];

    const projected = NormalizationService.projectRecord(normalized, requestedFields);
    assert.equal(projected.success, true);
    assert.equal(projected.record.name, 'Ananya Verma');
    assert.equal(projected.record.jobTitle, 'CTO at NextGen');
    assert.equal(projected.record.companyWebsite, ''); // Graceful empty fallback
    assert.equal(projected.record.fundingStage, '');
  });

  test('ProviderFactory resolves aliases for simulation and real modes', async () => {
    const p1 = ProviderFactory.getProvider('simulation');
    assert.equal(p1.constructor.name, 'MockDataProvider');

    const p2 = ProviderFactory.getProvider('mock');
    assert.equal(p2.constructor.name, 'MockDataProvider');

    const p3 = ProviderFactory.getProvider('real');
    assert.equal(p3.constructor.name, 'LinkedInAuthorizedProvider');

    const p4 = ProviderFactory.getProvider('authorized_linkedin');
    assert.equal(p4.constructor.name, 'LinkedInAuthorizedProvider');

    const meta = await ProviderFactory.getAvailableProviders();
    assert.ok(meta.providers.length >= 2);
  });
});
