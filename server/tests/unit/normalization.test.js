import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NormalizationService } from '../../src/services/normalizationService.js';

describe('NormalizationService', () => {
  test('strictly extracts only requested fields and handles alias mapping', () => {
    const raw = {
      fullName: 'Arjun Sharma',
      headline: 'CTO at ZeptoFin Labs',
      organization: 'ZeptoFin Labs',
      city: 'Bengaluru, India',
      linkedinUrl: 'https://www.linkedin.com/in/arjun-sharma-cto',
      unwantedSecretField: 'secret_123'
    };

    const requestedFields = [
      { key: 'name', label: 'Name' },
      { key: 'jobTitle', label: 'Job Title' },
      { key: 'company', label: 'Company' },
      { key: 'location', label: 'Location' },
      { key: 'profileUrl', label: 'Profile URL' }
    ];

    const result = NormalizationService.projectRecord(raw, requestedFields);
    assert.equal(result.success, true);
    assert.equal(result.record.name, 'Arjun Sharma');
    assert.equal(result.record.jobTitle, 'CTO at ZeptoFin Labs');
    assert.equal(result.record.company, 'ZeptoFin Labs');
    assert.equal(result.record.location, 'Bengaluru, India');
    assert.equal(result.record.profileUrl, 'https://www.linkedin.com/in/arjun-sharma-cto');
    assert.equal(result.record.unwantedSecretField, undefined);
  });

  test('gracefully populates empty string for uncollected custom fields without crashing', () => {
    const raw = {
      name: 'Priya Patel',
      jobTitle: 'VP Engineering'
    };

    const requestedFields = [
      { key: 'name', label: 'Name' },
      { key: 'fundingStage', label: 'Funding Stage', isCustom: true },
      { key: 'annualRevenue', label: 'Annual Revenue', isCustom: true }
    ];

    const result = NormalizationService.projectRecord(raw, requestedFields);
    assert.equal(result.success, true);
    assert.equal(result.record.name, 'Priya Patel');
    assert.equal(result.record.fundingStage, '');
    assert.equal(result.record.annualRevenue, '');
  });

  test('flags corrupted or completely empty records cleanly', () => {
    const resultNull = NormalizationService.projectRecord(null, [{ key: 'name' }]);
    assert.equal(resultNull.success, false);

    const resultCorrupted = NormalizationService.projectRecord({ _rawCorrupted: true }, [{ key: 'name' }]);
    assert.equal(resultCorrupted.success, false);
  });
});
