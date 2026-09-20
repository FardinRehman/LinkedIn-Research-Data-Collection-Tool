import { BaseDataProvider } from './BaseDataProvider.js';

export class MockDataProvider extends BaseDataProvider {
  constructor(config = {}) {
    super('mock-linkedin-provider', config);
    this.delayMs = config.delayMs || 350;
  }

  async fetchPage({ query = '', page = 1, pageSize = 10, category = 'auto' }) {
    // Simulate real network latency
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    const detectedCategory = this._detectCategory(query, category);
    const totalSimulatedRecords = 120; // 120 potential matching records for realistic pagination
    const totalPages = Math.ceil(totalSimulatedRecords / pageSize);

    if (page > totalPages) {
      return {
        records: [],
        page,
        pageSize,
        totalAvailable: totalSimulatedRecords,
        hasNextPage: false,
        providerMeta: { source: 'mock-generator', category: detectedCategory }
      };
    }

    const records = [];
    const startIndex = (page - 1) * pageSize;
    const countToGenerate = Math.min(pageSize, Math.max(0, totalSimulatedRecords - startIndex));

    for (let i = 0; i < countToGenerate; i++) {
      const globalIndex = startIndex + i;
      
      // Deliberately introduce an intentional duplicate every 8th record to test dedup engine
      const isDuplicateIndex = globalIndex > 3 && globalIndex % 7 === 0;
      const effectiveIndex = isDuplicateIndex ? Math.max(0, globalIndex - 3) : globalIndex;

      // Deliberately simulate an occasional partial/faulty record every 19th record
      const isFaulty = globalIndex > 0 && globalIndex % 19 === 0;

      if (detectedCategory === 'companies') {
        records.push(this._generateCompanyRecord(effectiveIndex, query, isFaulty));
      } else {
        records.push(this._generatePersonRecord(effectiveIndex, query, isFaulty));
      }
    }

    return {
      records,
      page,
      pageSize,
      totalAvailable: totalSimulatedRecords,
      hasNextPage: page < totalPages,
      providerMeta: {
        source: 'mock-generator',
        category: detectedCategory,
        generatedAt: new Date().toISOString()
      }
    };
  }

  _detectCategory(query, userCategory) {
    if (userCategory && userCategory !== 'auto') {
      return userCategory;
    }
    const q = (query || '').toLowerCase();
    if (q.includes('company') || q.includes('companies') || q.includes('startup') && (q.includes('fintech') || q.includes('saas') || q.includes('list'))) {
      if (!q.includes('cto') && !q.includes('ceo') && !q.includes('founder') && !q.includes('developer')) {
        return 'companies';
      }
    }
    return 'people';
  }

  _generatePersonRecord(index, query, isFaulty) {
    const firstNames = [
      'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Neha', 'Arjun', 'Sneha',
      'Kabir', 'Rhea', 'Aditya', 'Divya', 'Siddharth', 'Tanvi', 'Ishaan', 'Meera',
      'Rajesh', 'Pooja', 'Karan', 'Deepika', 'Alex', 'Sarah', 'Marcus', 'Elena'
    ];
    const lastNames = [
      'Sharma', 'Patel', 'Verma', 'Gupta', 'Iyer', 'Menon', 'Reddy', 'Nair',
      'Chopra', 'Kapoor', 'Deshmukh', 'Singhania', 'Bose', 'Mukherjee', 'Mehta',
      'Agarwal', 'Venkatesh', 'Joshi', 'Bhatia', 'Saxena', 'Chen', 'Johnson', 'Smith'
    ];
    const titles = [
      'Chief Technology Officer', 'VP of Engineering', 'Head of Technology',
      'Founder & CTO', 'Director of Engineering', 'Principal Architect',
      'Lead Data Scientist', 'VP of Product & Engineering', 'Co-Founder & Tech Lead'
    ];
    const companies = [
      'ZeptoFin Labs', 'RazorPay Technologies', 'KreditEase AI', 'BharatSaaS Tech',
      'HyperScale Cloud', 'FinNexus India', 'ZetaStack Systems', 'PaySprint Networks',
      'NexusWave Software', 'InnoVentures Digital', 'DataSphere Analytics', 'InfraPulse'
    ];
    const locations = [
      'Bengaluru, Karnataka, India', 'Mumbai, Maharashtra, India', 'Gurugram, Haryana, India',
      'Hyderabad, Telangana, India', 'Pune, Maharashtra, India', 'Noida, Uttar Pradesh, India',
      'Delhi NCR, India', 'Chennai, Tamil Nadu, India'
    ];
    const industries = [
      'Financial Services / FinTech', 'Enterprise Software & SaaS', 'Artificial Intelligence',
      'Information Technology', 'E-Commerce Infrastructure', 'Cloud & Cyber Security'
    ];
    const fundingStages = ['Bootstrapped', 'Seed Round', 'Series A ($8.5M)', 'Series B ($24M)', 'Series C ($65M)', 'Profitable / Scaled'];

    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[(index * 3) % lastNames.length];
    const fullName = `${firstName} ${lastName}`;
    const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${(index + 101)}`;
    const compName = companies[index % companies.length];
    const compSlug = compName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Faulty record simulation
    if (isFaulty) {
      return {
        _rawCorrupted: true,
        name: null,
        jobTitle: 'Unknown Role',
        errorHint: 'Record profile payload incomplete from upstream API'
      };
    }

    return {
      name: fullName,
      fullName: fullName,
      jobTitle: titles[index % titles.length],
      title: titles[index % titles.length],
      company: compName,
      companyName: compName,
      location: locations[index % locations.length],
      profileUrl: `https://www.linkedin.com/in/${slug}`,
      companyWebsite: `https://www.${compSlug}.io`,
      website: `https://www.${compSlug}.io`,
      industry: industries[index % industries.length],
      headline: `${titles[index % titles.length]} at ${compName} | Scaling High-Concurrency Systems`,
      summary: `Passionate technology leader specializing in modern distributed architecture, team building, and cloud scalability.`,
      experienceYears: 8 + (index % 12),
      education: 'Indian Institute of Technology / B.Tech Computer Science',
      skills: 'System Design, Microservices, Node.js, Python, Kubernetes, AWS',
      connectionDegree: index % 2 === 0 ? '2nd' : '1st',
      fundingStage: fundingStages[index % fundingStages.length],
      employeeCount: `${50 + (index * 45 * 3) % 1500} employees`,
      emailStatus: index % 3 === 0 ? 'Verified Work Email Available' : 'Searchable via Domain'
    };
  }

  _generateCompanyRecord(index, query, isFaulty) {
    const companies = [
      { name: 'KreditEase AI', domain: 'kreditease.ai', ind: 'Financial Services & Lending Tech' },
      { name: 'PaySprint Gateway', domain: 'paysprint.com', ind: 'Payment Gateway & Banking APIs' },
      { name: 'NexusWealth Robo-Advisory', domain: 'nexuswealth.io', ind: 'WealthTech & Asset Management' },
      { name: 'InnoInsurTech India', domain: 'innoinsur.co', ind: 'InsurTech & Risk Analytics' },
      { name: 'BharatCrypto Custody', domain: 'bharatcrypto.io', ind: 'Digital Assets & Web3 Security' },
      { name: 'SaaSFlow Subscriptions', domain: 'saasflow.com', ind: 'Billing & Recurring Payments' },
      { name: 'LendPulse Microfinance', domain: 'lendpulse.in', ind: 'Alternative Credit Scoring & Micro-lending' },
      { name: 'TaxZen Automated Compliance', domain: 'taxzen.org', ind: 'FinTech Compliance & Regulatory Tech' },
      { name: 'QuantLedger Analytics', domain: 'quantledger.tech', ind: 'High-Frequency Trading & Market Data' },
      { name: 'OmniPay Retail Solutions', domain: 'omnipay.in', ind: 'Merchant POS & Unified QR Solutions' }
    ];
    const locations = [
      'Bengaluru, Karnataka, India', 'Mumbai, Maharashtra, India', 'Gurugram, Haryana, India',
      'Hyderabad, Telangana, India', 'Pune, Maharashtra, India'
    ];
    const stages = ['Seed ($1.8M)', 'Pre-Series A ($4.2M)', 'Series A ($12M)', 'Series B ($35M)', 'Series C ($90M)', 'Profitable'];
    const employeeBuckets = ['11-50 employees', '51-200 employees', '201-500 employees', '501-1,000 employees', '1,001-5,000 employees'];

    const comp = companies[index % companies.length];
    const iteration = Math.floor(index / companies.length);
    const suffix = iteration > 0 ? ` ${iteration + 1}` : '';
    const slugSuffix = iteration > 0 ? `-${iteration + 1}` : '';
    const compName = `${comp.name}${suffix}`;
    const slug = `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}${slugSuffix}`;

    if (isFaulty) {
      return {
        _rawCorrupted: true,
        companyName: null,
        errorHint: 'Company entity metadata withheld by security policy'
      };
    }

    return {
      companyName: compName,
      name: compName,
      companyUrl: `https://www.linkedin.com/company/${slug}`,
      profileUrl: `https://www.linkedin.com/company/${slug}`,
      website: `https://www.${comp.domain}`,
      companyWebsite: `https://www.${comp.domain}`,
      industry: comp.ind,
      location: locations[index % locations.length],
      headquarters: locations[index % locations.length],
      employeeCount: employeeBuckets[index % employeeBuckets.length],
      fundingStage: stages[index % stages.length],
      foundedYear: 2017 + (index % 7),
      specialties: 'API Integrations, Cloud Security, Automated Reconciliation, Real-Time Settlements',
      type: 'Privately Held'
    };
  }
}
