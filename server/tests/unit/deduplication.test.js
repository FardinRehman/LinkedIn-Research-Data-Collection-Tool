import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DeduplicationService, JobDeduplicationRegistry } from '../../src/services/deduplicationService.js';

describe('DeduplicationService', () => {
  test('canonicalizes URLs by stripping tracking query params and lowercasing', () => {
    const rawUrl1 = 'https://www.linkedin.com/in/arjun-sharma-cto/?trk=public_profile-settings_trk&miniProfileUrn=urn%3Ali%3Afs_miniProfile%3A123';
    const rawUrl2 = 'http://linkedin.com/in/arjun-sharma-cto';

    const canon1 = DeduplicationService.canonicalizeUrl(rawUrl1);
    const canon2 = DeduplicationService.canonicalizeUrl(rawUrl2);

    assert.equal(canon1, 'linkedin.com/in/arjun-sharma-cto');
    assert.equal(canon2, 'linkedin.com/in/arjun-sharma-cto');
    assert.equal(canon1, canon2);
  });

  test('identifies identical LinkedIn profile URLs as duplicates', () => {
    const registry = new JobDeduplicationRegistry('people');

    const record1 = {
      name: 'Arjun Sharma',
      profileUrl: 'https://www.linkedin.com/in/arjun-sharma-cto'
    };
    const record2 = {
      name: 'Arjun Sharma (Updated)',
      profileUrl: 'https://linkedin.com/in/arjun-sharma-cto?trk=guest_job_search_people-result-card_result-card_full-click'
    };

    const res1 = registry.isDuplicate(record1);
    const res2 = registry.isDuplicate(record2);

    assert.equal(res1.isDup, false);
    assert.equal(res2.isDup, true);
    assert.equal(registry.duplicateCount, 1);
    assert.equal(registry.seenFingerprints.size, 1);
  });

  test('does NOT flag two different people who happen to have the same name when URLs or companies differ', () => {
    const registry = new JobDeduplicationRegistry('people');

    const personA = {
      name: 'Rahul Sharma',
      company: 'TCS',
      location: 'Bengaluru',
      jobTitle: 'Developer'
    };
    const personB = {
      name: 'Rahul Sharma',
      company: 'Infosys',
      location: 'Pune',
      jobTitle: 'Architect'
    };

    const resA = registry.isDuplicate(personA);
    const resB = registry.isDuplicate(personB);

    assert.equal(resA.isDup, false);
    assert.equal(resB.isDup, false);
    assert.equal(registry.duplicateCount, 0);
  });
});
