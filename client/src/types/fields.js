export const PRESETS = {
  PEOPLE: {
    id: 'people',
    name: 'People / Executive Research',
    description: 'Target CTOs, Founders, Engineering Leaders, and Talent profiles',
    category: 'people',
    defaultQuery: 'CTO startup India',
    fields: [
      { key: 'name', label: 'Name', isCustom: false, selected: true },
      { key: 'jobTitle', label: 'Job Title', isCustom: false, selected: true },
      { key: 'company', label: 'Company', isCustom: false, selected: true },
      { key: 'location', label: 'Location', isCustom: false, selected: true },
      { key: 'profileUrl', label: 'Profile URL', isCustom: false, selected: true },
      { key: 'companyWebsite', label: 'Company Website', isCustom: false, selected: true },
      { key: 'industry', label: 'Industry', isCustom: false, selected: true },
      { key: 'headline', label: 'Headline', isCustom: false, selected: false },
      { key: 'experienceYears', label: 'Years Experience', isCustom: false, selected: false },
      { key: 'skills', label: 'Skills', isCustom: false, selected: false },
      { key: 'education', label: 'Education', isCustom: false, selected: false },
      { key: 'emailStatus', label: 'Email Status', isCustom: false, selected: false }
    ]
  },
  COMPANIES: {
    id: 'companies',
    name: 'Company & Market Research',
    description: 'Target Startups, FinTechs, SaaS firms, and Enterprise entities',
    category: 'companies',
    defaultQuery: 'FinTech companies India',
    fields: [
      { key: 'companyName', label: 'Company Name', isCustom: false, selected: true },
      { key: 'companyUrl', label: 'Company URL', isCustom: false, selected: true },
      { key: 'industry', label: 'Industry', isCustom: false, selected: true },
      { key: 'employeeCount', label: 'Employee Count', isCustom: false, selected: true },
      { key: 'location', label: 'Location', isCustom: false, selected: true },
      { key: 'website', label: 'Website', isCustom: false, selected: true },
      { key: 'fundingStage', label: 'Funding Stage', isCustom: false, selected: true },
      { key: 'foundedYear', label: 'Founded Year', isCustom: false, selected: false },
      { key: 'specialties', label: 'Specialties', isCustom: false, selected: false },
      { key: 'type', label: 'Company Type', isCustom: false, selected: false }
    ]
  }
};

export const normalizeFieldKey = (label) => {
  if (!label) return '';
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, chr => chr.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, '');
};
