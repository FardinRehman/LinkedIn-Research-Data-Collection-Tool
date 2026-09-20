import crypto from 'crypto';

/**
 * Deduplication Service
 * Provides composite fingerprinting and duplicate detection for Person and Company records.
 */
export class DeduplicationService {
  /**
   * Canonicalize LinkedIn / web URLs by lowercasing, removing tracking query params, trailing slashes, etc.
   */
  static canonicalizeUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    try {
      let urlStr = rawUrl.trim();
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        urlStr = `https://${urlStr}`;
      }
      const parsed = new URL(urlStr);
      // Strip tracking query parameters common in LinkedIn
      const cleanParams = new URLSearchParams();
      for (const [key, value] of parsed.searchParams.entries()) {
        if (!key.startsWith('trk') && !key.startsWith('miniProfile') && key !== 'originalSubdomain') {
          cleanParams.append(key, value);
        }
      }
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      let pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();
      
      const queryPart = cleanParams.toString() ? `?${cleanParams.toString()}` : '';
      return `${host}${pathname}${queryPart}`;
    } catch {
      return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
    }
  }

  /**
   * Compute a deterministic unique fingerprint for a record.
   * @param {Object} rawRecord - The raw record object from the provider
   * @param {string} category - 'people' | 'companies' | 'auto'
   * @returns {{ fingerprint: string, strategy: string }}
   */
  static generateFingerprint(rawRecord, category = 'people') {
    if (!rawRecord || typeof rawRecord !== 'object') {
      return { fingerprint: crypto.randomUUID(), strategy: 'random_fallback' };
    }

    const url = rawRecord.profileUrl || rawRecord.companyUrl || rawRecord.url || rawRecord.link || rawRecord.website;
    const canonicalUrl = this.canonicalizeUrl(url);

    // 1. If valid profile / company URL exists, it is the primary unique identifier
    if (canonicalUrl && (canonicalUrl.includes('linkedin.com/in/') || canonicalUrl.includes('linkedin.com/company/'))) {
      return {
        fingerprint: `url:${canonicalUrl}`,
        strategy: 'canonical_linkedin_url'
      };
    }

    // 2. If website domain exists for company records
    if (category === 'companies' && canonicalUrl) {
      return {
        fingerprint: `domain:${canonicalUrl}`,
        strategy: 'company_domain'
      };
    }

    // 3. Composite fallback:
    if (category === 'companies') {
      const compName = this._cleanStr(rawRecord.companyName || rawRecord.name || '');
      const location = this._cleanStr(rawRecord.location || rawRecord.headquarters || '');
      const composite = `${compName}|${location}`;
      return {
        fingerprint: `composite_comp:${crypto.createHash('sha256').update(composite).digest('hex')}`,
        strategy: 'company_name_location_composite'
      };
    }

    // Person Composite Fallback: name + company + location (Avoid blindly deduplicating by name alone!)
    const name = this._cleanStr(rawRecord.name || rawRecord.fullName || '');
    const company = this._cleanStr(rawRecord.company || rawRecord.companyName || '');
    const location = this._cleanStr(rawRecord.location || '');
    const jobTitle = this._cleanStr(rawRecord.jobTitle || rawRecord.title || '');

    const composite = `${name}|${company}|${location}|${jobTitle}`;
    return {
      fingerprint: `composite_person:${crypto.createHash('sha256').update(composite).digest('hex')}`,
      strategy: 'person_composite_key'
    };
  }

  static _cleanStr(val) {
    if (!val || typeof val !== 'string') return '';
    return val.toLowerCase().replace(/\s+/g, ' ').trim();
  }
}

/**
 * Stateful registry for tracking duplicates within a single job execution
 */
export class JobDeduplicationRegistry {
  constructor(category = 'people') {
    this.category = category;
    this.seenFingerprints = new Set();
    this.duplicateCount = 0;
  }

  /**
   * Check if record is a duplicate. If unique, registers fingerprint and returns false.
   * If duplicate, increments counter and returns true.
   */
  isDuplicate(rawRecord) {
    const { fingerprint, strategy } = DeduplicationService.generateFingerprint(rawRecord, this.category);
    if (this.seenFingerprints.has(fingerprint)) {
      this.duplicateCount++;
      return { isDup: true, fingerprint, strategy };
    }
    this.seenFingerprints.add(fingerprint);
    return { isDup: false, fingerprint, strategy };
  }

  getMetrics() {
    return {
      totalUnique: this.seenFingerprints.size,
      totalDuplicates: this.duplicateCount
    };
  }
}
