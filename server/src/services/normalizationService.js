/**
 * Normalization Service
 * Sanitizes data and dynamically projects records onto the user's requested output fields.
 */
export class NormalizationService {
  /**
   * Field aliases map to support slight naming variations in providers
   */
  static ALIASES = {
    name: ['fullName', 'personName', 'profileName', 'titleName'],
    jobTitle: ['title', 'headline', 'role', 'position', 'designation'],
    company: ['companyName', 'currentCompany', 'organization', 'employer'],
    companyName: ['company', 'organization', 'employer', 'name'],
    location: ['city', 'country', 'region', 'headquarters', 'geo'],
    profileUrl: ['url', 'linkedinUrl', 'link', 'companyUrl'],
    companyUrl: ['profileUrl', 'url', 'linkedinUrl', 'link'],
    website: ['companyWebsite', 'domain', 'homepageUrl', 'web'],
    companyWebsite: ['website', 'domain', 'homepageUrl', 'web'],
    industry: ['sector', 'category', 'domainCategory'],
    employeeCount: ['employees', 'companySize', 'teamSize', 'size'],
    fundingStage: ['funding', 'stage', 'round', 'investmentStage'],
    experienceYears: ['experience', 'yearsExperience', 'yoe'],
    skills: ['technologies', 'skillSet', 'techStack'],
    education: ['degree', 'school', 'university']
  };

  /**
   * Normalize and dynamically project a raw record to only the selected fields.
   * @param {Object} rawRecord - Raw item from data provider
   * @param {Array<{ key: string, label?: string, isCustom?: boolean }>} requestedFields - User-selected fields
   * @returns {{ success: boolean, record: Object|null, error?: string }}
   */
  static projectRecord(rawRecord, requestedFields = []) {
    if (!rawRecord || typeof rawRecord !== 'object' || rawRecord._rawCorrupted) {
      return {
        success: false,
        record: null,
        error: rawRecord?.errorHint || 'Corrupted or unreadable upstream record structure'
      };
    }

    const projected = {};
    let matchedFieldCount = 0;

    for (const field of requestedFields) {
      const fieldKey = typeof field === 'string' ? field : field.key;
      const normalizedKey = this._normalizeKey(fieldKey);

      const value = this._extractFieldValue(rawRecord, normalizedKey, fieldKey);
      
      // Sanitize string values
      if (typeof value === 'string') {
        projected[fieldKey] = value.trim();
      } else if (value === undefined || value === null) {
        projected[fieldKey] = ''; // Graceful default for missing/custom fields
      } else {
        projected[fieldKey] = value;
      }

      if (projected[fieldKey] !== '') {
        matchedFieldCount++;
      }
    }

    // If record has zero valid fields populated, treat as failed record
    if (requestedFields.length > 0 && matchedFieldCount === 0) {
      return {
        success: false,
        record: null,
        error: 'Record contained no matching values for requested fields'
      };
    }

    return {
      success: true,
      record: projected
    };
  }

  /**
   * Extract value from record checking exact key, normalized key, and known aliases
   */
  static _extractFieldValue(record, normalizedKey, originalKey) {
    // 1. Direct match on original key
    if (record[originalKey] !== undefined && record[originalKey] !== null) {
      return record[originalKey];
    }

    // 2. Direct match on normalized camelCase
    if (record[normalizedKey] !== undefined && record[normalizedKey] !== null) {
      return record[normalizedKey];
    }

    // 3. Match case-insensitively across record keys
    const recordKeys = Object.keys(record);
    const caseInsensitiveMatch = recordKeys.find(
      k => this._normalizeKey(k) === normalizedKey || k.toLowerCase() === originalKey.toLowerCase()
    );
    if (caseInsensitiveMatch && record[caseInsensitiveMatch] !== undefined && record[caseInsensitiveMatch] !== null) {
      return record[caseInsensitiveMatch];
    }

    // 4. Match against known aliases
    const aliases = this.ALIASES[normalizedKey] || [];
    for (const alias of aliases) {
      const foundKey = recordKeys.find(
        k => this._normalizeKey(k) === this._normalizeKey(alias)
      );
      if (foundKey && record[foundKey] !== undefined && record[foundKey] !== null) {
        return record[foundKey];
      }
    }

    return '';
  }

  /**
   * Convert arbitrary user field strings ("Company Website", "company_website") to camelCase "companyWebsite"
   */
  static _normalizeKey(str) {
    if (!str) return '';
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, chr => chr.toLowerCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }
}
