/**
 * Client-side Simulation Engine for GitHub Pages (github.io)
 * Allows visitors to run full research collections, dynamic fields,
 * and exports directly in their browser without requiring a backend.
 */
export class ClientResearchEngine {
  constructor() {
    this.jobs = new Map();
  }

  createJob({ query = '', limit = 50, fields = [], category = 'people' }) {
    const jobId = `job_${Date.now()}`;
    const selectedFields = fields.filter(f => f.selected !== false);

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 50, 250));

    const job = {
      id: jobId,
      query: query.trim() || 'LinkedIn Research',
      limit: parsedLimit,
      fields: selectedFields,
      category: category || 'people',
      status: 'in_progress',
      progress: {
        totalTarget: parsedLimit,
        processedRecords: 0,
        uniqueRecords: 0,
        duplicateRecords: 0,
        failedRecords: 0,
        currentPage: 1,
        percent: 0
      },
      metrics: {
        totalRawFetched: 0,
        unique: 0,
        duplicates: 0,
        failed: 0,
        pagesProcessed: 1
      },
      results: [],
      failedItems: [],
      recentLogs: [
        { timestamp: new Date().toISOString(), level: 'info', message: `Job initialized for query "${query}" targeting ${parsedLimit} records.` },
        { timestamp: new Date().toISOString(), level: 'info', message: `Using Simulation Engine. Starting collection...` }
      ]
    };

    this.jobs.set(jobId, job);
    this._simulateCollection(job);
    return { jobId, status: 'in_progress' };
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async _simulateCollection(job) {
    const batchSize = 10;
    const totalBatches = Math.ceil(job.limit / batchSize);
    const seenUrls = new Set();

    for (let batch = 1; batch <= totalBatches; batch++) {
      await new Promise(r => setTimeout(r, 280)); // Realistic smooth animation
      job.progress.currentPage = batch;
      job.metrics.pagesProcessed = batch;

      const itemsToGenerate = Math.min(batchSize, job.limit - job.results.length);

      for (let i = 0; i < itemsToGenerate; i++) {
        job.progress.processedRecords++;
        const globalIdx = (batch - 1) * batchSize + i;

        // Introduce simulated duplicate every 7th record
        const isDup = globalIdx > 2 && globalIdx % 7 === 0;
        const effectiveIndex = isDup ? Math.max(0, globalIdx - 3) : globalIdx;

        const raw = job.category === 'companies'
          ? this._generateCompany(effectiveIndex, job.query)
          : this._generatePerson(effectiveIndex, job.query);

        const uniqueKey = (raw.profileUrl || raw.companyUrl || `${raw.name}|${raw.company}`).toLowerCase();
        if (seenUrls.has(uniqueKey)) {
          job.progress.duplicateRecords++;
          job.metrics.duplicates++;
          job.recentLogs.push({
            timestamp: new Date().toISOString(),
            level: 'debug',
            message: `Duplicate detected and filtered: ${raw.name || raw.companyName}`
          });
          continue;
        }
        seenUrls.add(uniqueKey);

        // Project strictly to selected dynamic fields
        const projected = { _id: `rec_${job.results.length + 1}` };
        for (const f of job.fields) {
          const key = f.key;
          if (raw[key] !== undefined && raw[key] !== null) {
            projected[key] = raw[key];
          } else if (f.isCustom) {
            // Assign smart default for popular custom fields if recognized
            projected[key] = raw[this._normalizeKey(key)] || raw.fundingStage || raw.skills || 'Configured';
          } else {
            projected[key] = '';
          }
        }

        job.results.push(projected);
        job.progress.uniqueRecords = job.results.length;
        job.metrics.unique = job.results.length;
        job.progress.percent = Math.min(100, Math.round((job.results.length / job.limit) * 100));

        if (job.results.length >= job.limit) break;
      }

      job.recentLogs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Page ${batch} processed (${job.results.length}/${job.limit} unique records collected)`
      });

      if (job.results.length >= job.limit) break;
    }

    job.status = 'completed';
    job.progress.percent = 100;
    job.recentLogs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Job completed successfully! Total unique collected: ${job.results.length}, Duplicates removed: ${job.metrics.duplicates}`
    });
  }

  _generatePerson(index, query) {
    const firstNames = ['Arjun', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Neha', 'Aditya', 'Sneha', 'Kabir', 'Divya', 'Siddharth', 'Tanvi', 'Rajesh', 'Pooja', 'Alex', 'Elena'];
    const lastNames = ['Sharma', 'Patel', 'Verma', 'Gupta', 'Iyer', 'Reddy', 'Mehta', 'Kapoor', 'Chopra', 'Nair', 'Deshmukh', 'Singhania', 'Bose', 'Mukherjee'];
    const titles = ['Chief Technology Officer', 'VP of Engineering', 'Head of Technology', 'Founder & CTO', 'Director of Engineering', 'Principal Architect', 'VP of AI & ML Engineering'];
    const companies = ['ZeptoFin Labs', 'RazorPay Technologies', 'KreditEase AI', 'BharatSaaS Tech', 'HyperScale Cloud', 'FinNexus India', 'ZetaStack Systems', 'PaySprint Networks'];
    const locations = ['Bengaluru, Karnataka, India', 'Mumbai, Maharashtra, India', 'Gurugram, Haryana, India', 'Hyderabad, Telangana, India', 'Pune, Maharashtra, India', 'Delhi NCR, India'];
    const industries = ['Financial Services / FinTech', 'Enterprise Software & SaaS', 'Artificial Intelligence', 'Cloud & Cyber Security'];
    const stages = ['Series A ($12M)', 'Series B ($35M)', 'Seed ($2.5M)', 'Series C ($70M)', 'Bootstrapped', 'Profitable / Scaled'];

    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[(index * 3) % lastNames.length];
    const suffix = index >= firstNames.length ? ` ${Math.floor(index / firstNames.length) + 1}` : '';
    const fullName = `${firstName} ${lastName}${suffix}`;
    const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${index + 101}`;
    const comp = companies[index % companies.length];
    const compSlug = comp.toLowerCase().replace(/[^a-z0-9]/g, '');

    return {
      name: fullName,
      fullName: fullName,
      jobTitle: titles[index % titles.length],
      title: titles[index % titles.length],
      company: comp,
      companyName: comp,
      location: locations[index % locations.length],
      profileUrl: `https://www.linkedin.com/in/${slug}`,
      companyWebsite: `https://www.${compSlug}.io`,
      website: `https://www.${compSlug}.io`,
      industry: industries[index % industries.length],
      headline: `${titles[index % titles.length]} at ${comp} | Scaling High-Concurrency Systems`,
      experienceYears: 8 + (index % 12),
      skills: 'System Design, Microservices, Node.js, Python, Kubernetes, AWS',
      education: 'Indian Institute of Technology / B.Tech Computer Science',
      emailStatus: index % 2 === 0 ? 'Verified Work Email Available' : 'Searchable via Domain',
      fundingStage: stages[index % stages.length],
      employeeCount: `${50 + (index * 45 * 3) % 1500} employees`
    };
  }

  _generateCompany(index, query) {
    const companies = [
      { name: 'KreditEase AI', domain: 'kreditease.ai', ind: 'Financial Services & Lending Tech' },
      { name: 'PaySprint Gateway', domain: 'paysprint.com', ind: 'Payment Gateway & Banking APIs' },
      { name: 'NexusWealth Robo-Advisory', domain: 'nexuswealth.io', ind: 'WealthTech & Asset Management' },
      { name: 'InnoInsurTech India', domain: 'innoinsur.co', ind: 'InsurTech & Risk Analytics' },
      { name: 'BharatCrypto Custody', domain: 'bharatcrypto.io', ind: 'Digital Assets & Web3 Security' },
      { name: 'SaaSFlow Subscriptions', domain: 'saasflow.com', ind: 'Billing & Recurring Payments' },
      { name: 'QuantLedger Analytics', domain: 'quantledger.tech', ind: 'High-Frequency Trading & Market Data' }
    ];
    const locations = ['Bengaluru, Karnataka, India', 'Mumbai, Maharashtra, India', 'Gurugram, Haryana, India', 'Hyderabad, Telangana, India'];
    const stages = ['Seed ($1.8M)', 'Pre-Series A ($4.2M)', 'Series A ($12M)', 'Series B ($35M)', 'Series C ($90M)', 'Profitable'];
    const employeeBuckets = ['11-50 employees', '51-200 employees', '201-500 employees', '501-1,000 employees'];

    const comp = companies[index % companies.length];
    const suffix = index >= companies.length ? ` ${Math.floor(index / companies.length) + 1}` : '';
    const slugSuffix = index >= companies.length ? `-${Math.floor(index / companies.length) + 1}` : '';
    const compName = `${comp.name}${suffix}`;
    const slug = `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}${slugSuffix}`;

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

  _normalizeKey(str) {
    if (!str) return '';
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, chr => chr.toLowerCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  exportClientData(records, fields, format) {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), recordCount: records.length, results: records }, null, 2)], { type: 'application/json' });
      this._downloadBlob(blob, `linkedin_research_${Date.now()}.json`);
      return;
    }

    if (format === 'csv') {
      const headers = fields.map(f => `"${(f.label || f.key).replace(/"/g, '""')}"`).join(',');
      const rows = records.map(row => {
        return fields.map(f => {
          const val = row[f.key] !== undefined && row[f.key] !== null ? String(row[f.key]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',');
      });
      const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this._downloadBlob(blob, `linkedin_research_${Date.now()}.csv`);
      return;
    }

    // Default XLSX / TSV fallback for browser
    const headers = fields.map(f => f.label || f.key).join('\t');
    const rows = records.map(row => fields.map(f => row[f.key] || '').join('\t'));
    const tsvContent = [headers, ...rows].join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
    this._downloadBlob(blob, `linkedin_research_${Date.now()}.xls`);
  }

  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const clientEngine = new ClientResearchEngine();
