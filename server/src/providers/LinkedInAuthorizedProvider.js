import { BaseDataProvider } from './BaseDataProvider.js';
import { ProviderError } from '../utils/errors.js';
import { config } from '../config/index.js';

/**
 * RealLinkedInProvider (LinkedInAuthorizedProvider)
 * Adapter for compliant, authorized LinkedIn REST APIs or authorized data provider integrations.
 * 
 * IMPORTANT:
 * - Does NOT implement CAPTCHA bypass, scraping, session theft, or rate-limit evasion.
 * - If credentials are not configured, it fails cleanly with a descriptive message.
 * - Never fabricates fake data when in 'real' mode.
 */
export class LinkedInAuthorizedProvider extends BaseDataProvider {
  constructor(customConfig = {}) {
    super('authorized-real-provider', customConfig);
    this.baseUrl = customConfig.baseUrl || config.linkedIn.baseUrl || 'https://api.linkedin.com/v2';
    this.apiKey = customConfig.apiKey || config.linkedIn.apiKey || '';
    this.clientId = customConfig.clientId || config.linkedIn.clientId || '';
    this.clientSecret = customConfig.clientSecret || config.linkedIn.clientSecret || '';
  }

  /**
   * Check whether the authorized provider is configured and available.
   */
  async checkHealth() {
    if (!this.apiKey) {
      return {
        available: false,
        status: 'not_configured',
        message: 'Real data provider is not configured. Please configure the authorized provider credentials in .env.'
      };
    }
    return {
      available: true,
      status: 'connected',
      message: 'Authorized real data provider is configured.'
    };
  }

  /**
   * Fetch a single page of results from the authorized upstream data source.
   */
  async fetchPage({ query = '', page = 1, pageSize = 25, category = 'people', cursor = null, options = {} }) {
    // 1. Strict verification: if not configured, throw immediately without faking data
    if (!this.apiKey) {
      throw new ProviderError(
        'Real data provider is not configured. Please configure the authorized provider credentials.',
        {
          provider: this.name,
          requiredEnv: ['LINKEDIN_API_KEY', 'LINKEDIN_API_BASE_URL'],
          status: 'not_configured'
        }
      );
    }

    const startOffset = (page - 1) * pageSize;
    const searchParams = new URLSearchParams({
      q: query,
      start: String(startOffset),
      count: String(pageSize),
      category: category || 'people'
    });

    if (cursor) {
      searchParams.set('cursor', cursor);
    }

    const endpoint = category === 'companies' 
      ? `${this.baseUrl}/organization-search?${searchParams.toString()}`
      : `${this.baseUrl}/people-search?${searchParams.toString()}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Accept': 'application/json',
          'User-Agent': 'LinkedIn-Research-Tool/1.0.0'
        },
        signal: AbortSignal.timeout(12000) // 12-second network timeout
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new ProviderError(
            `Authorized Provider Authentication Failed (${response.status}): Invalid or expired API credentials.`,
            { statusCode: response.status }
          );
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after') || '60';
          throw new ProviderError(
            `Authorized Provider Rate Limited (429): Quota exceeded. Retry after ${retryAfter}s.`,
            { statusCode: 429, retryAfter }
          );
        }
        throw new ProviderError(
          `Authorized Provider Error (${response.status}): ${response.statusText}`,
          { statusCode: response.status }
        );
      }

      const json = await response.json();
      const rawElements = json.elements || json.data || json.items || [];
      const totalAvailable = json.paging?.total || json.total || rawElements.length;
      const nextCursor = json.paging?.nextCursor || null;
      const hasNextPage = Boolean(
        nextCursor || 
        (json.paging?.links && json.paging.links.some(l => l.rel === 'next')) || 
        (startOffset + rawElements.length < totalAvailable)
      );

      // Normalize each record strictly without fabricating missing fields
      const records = rawElements.map(raw => this.normalizeRecord(raw, category));

      return {
        records,
        page,
        pageSize,
        totalAvailable,
        hasNextPage,
        nextCursor,
        providerMeta: {
          source: 'authorized-real-provider',
          category,
          authenticated: true
        }
      };
    } catch (err) {
      if (err instanceof ProviderError) {
        throw err;
      }
      if (err.name === 'TimeoutError') {
        throw new ProviderError('Authorized Provider connection timed out after 12 seconds.', { timeout: true });
      }
      throw new ProviderError(`Authorized Provider request failed: ${err.message}`, { originalError: err.message });
    }
  }

  /**
   * Normalization layer: maps raw authorized response into standard canonical record.
   * If a field is not returned by the API, it is explicitly set to null/empty string (NO fake data).
   */
  normalizeRecord(raw, category = 'people') {
    if (!raw || typeof raw !== 'object') {
      return { _rawCorrupted: true, errorHint: 'Empty upstream record object' };
    }

    if (category === 'companies') {
      return {
        companyName: raw.name || raw.localizedName || raw.organizationName || null,
        companyUrl: raw.vanityName ? `https://www.linkedin.com/company/${raw.vanityName}` : (raw.url || null),
        industry: raw.industry || raw.primaryIndustry || null,
        employeeCount: raw.staffCountRange || raw.employeeCount || null,
        location: raw.location?.city || raw.headquarters || raw.location?.country || null,
        website: raw.website || raw.companyPageUrl || null,
        fundingStage: raw.fundingStage || null,
        foundedYear: raw.foundedOn?.year || raw.foundedYear || null,
        specialties: Array.isArray(raw.specialties) ? raw.specialties.join(', ') : (raw.specialties || null),
        type: raw.organizationType || null,
        _providerRecordId: raw.id || raw.urn || null
      };
    }

    // Default People Record
    const firstName = raw.firstName?.localized?.en_US || raw.firstName || '';
    const lastName = raw.lastName?.localized?.en_US || raw.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || raw.name || raw.fullName || null;

    return {
      name,
      jobTitle: raw.headline || raw.title || raw.positions?.values?.[0]?.title || null,
      company: raw.positions?.values?.[0]?.company?.name || raw.companyName || raw.currentCompany || null,
      location: raw.location?.name || raw.geoLocationName || raw.location || null,
      profileUrl: raw.vanityName ? `https://www.linkedin.com/in/${raw.vanityName}` : (raw.url || raw.publicProfileUrl || null),
      companyWebsite: raw.companyWebsite || null,
      industry: raw.industryName || raw.industry || null,
      headline: raw.headline || null,
      experienceYears: raw.experienceYears || null,
      skills: Array.isArray(raw.skills) ? raw.skills.map(s => s.name || s).join(', ') : (raw.skills || null),
      education: raw.educations?.values?.[0]?.schoolName || raw.education || null,
      emailStatus: raw.email ? 'Available' : null,
      _providerRecordId: raw.id || raw.urn || null
    };
  }
}

// Export aliases
export const RealLinkedInProvider = LinkedInAuthorizedProvider;
