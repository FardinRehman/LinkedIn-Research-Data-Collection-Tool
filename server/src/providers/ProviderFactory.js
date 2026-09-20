import { MockDataProvider } from './MockDataProvider.js';
import { LinkedInAuthorizedProvider } from './LinkedInAuthorizedProvider.js';
import { config } from '../config/index.js';
import { ValidationError } from '../utils/errors.js';

export class ProviderFactory {
  /**
   * Resolve and instantiate the requested or default provider
   */
  static getProvider(providerName = null, options = {}) {
    const activeName = (providerName || config.dataProvider || 'simulation').toLowerCase();

    switch (activeName) {
      case 'simulation':
      case 'mock':
      case 'mock_provider':
        return new MockDataProvider(options);

      case 'real':
      case 'authorized_linkedin':
      case 'linkedin_api':
      case 'linkedin':
      case 'real_provider':
        return new LinkedInAuthorizedProvider(options);

      default:
        throw new ValidationError(
          `Unknown data provider: "${activeName}". Supported providers: "simulation", "real"`
        );
    }
  }

  /**
   * Get metadata and configuration health for all providers
   */
  static async getAvailableProviders() {
    const realProvider = new LinkedInAuthorizedProvider();
    const realHealth = await realProvider.checkHealth();

    const activeId = ['real', 'authorized_linkedin'].includes(config.dataProvider) ? 'real' : 'simulation';

    return {
      activeProvider: activeId,
      providers: [
        {
          id: 'simulation',
          name: 'Simulation Provider',
          label: 'Data Source: Simulation',
          description: 'Multi-page synthetic test data with realistic latency, dynamic fields, and duplicate simulation.',
          isDefault: activeId === 'simulation',
          status: 'connected',
          isConfigured: true,
          mode: 'simulation'
        },
        {
          id: 'real',
          name: 'Authorized Real Provider',
          label: 'Data Source: Authorized Provider',
          description: 'Compliant REST adapter connecting to authorized LinkedIn API / approved enterprise data partner.',
          isDefault: activeId === 'real',
          status: realHealth.status,
          isConfigured: realHealth.available,
          mode: 'real',
          message: realHealth.message,
          requiredEnv: ['LINKEDIN_API_KEY', 'LINKEDIN_API_BASE_URL']
        }
      ]
    };
  }
}
