/**
 * Abstract BaseDataProvider
 * Defines the contract that all data collection adapters (Simulation and Real) must implement.
 */
export class BaseDataProvider {
  constructor(name = 'base-provider', config = {}) {
    if (new.target === BaseDataProvider) {
      throw new TypeError('Cannot construct BaseDataProvider instances directly');
    }
    this.name = name;
    this.config = config;
  }

  /**
   * Search / fetch a single page of results for a query.
   * @param {Object} params
   * @param {string} params.query - Search keywords / target
   * @param {number} params.page - 1-based page index
   * @param {number} params.pageSize - Number of items per page
   * @param {string} params.category - 'people' | 'companies' | 'auto'
   * @param {string|null} [params.cursor] - Optional pagination cursor
   * @param {Object} [params.options] - Optional filters / provider-specific params
   * @returns {Promise<{
   *   records: Array<Object>,
   *   page: number,
   *   pageSize: number,
   *   totalAvailable: number,
   *   hasNextPage: boolean,
   *   nextCursor?: string|null,
   *   providerMeta?: Object
   * }>}
   */
  async fetchPage(params) {
    throw new Error(`fetchPage() is not implemented in ${this.constructor.name}`);
  }

  /**
   * High-level search convenience method
   */
  async search(query, options = {}) {
    return this.fetchPage({ query, page: 1, pageSize: 25, ...options });
  }

  /**
   * Normalize a raw upstream record into the standard canonical structure.
   * If a field is not returned by the upstream source, it remains empty / null (NO fabricated values).
   * @param {Object} rawRecord
   * @returns {Object}
   */
  normalizeRecord(rawRecord) {
    return rawRecord;
  }

  /**
   * Validate provider credentials and connectivity health.
   * @returns {Promise<{ available: boolean, status: string, message?: string }>}
   */
  async checkHealth() {
    return { available: true, status: 'connected' };
  }
}
