/** DEMO DATA — indicative figures only. See lib/data/schema.js. */

export const companies = [
  { id: 'bajaj-finserv', name: 'Bajaj Finserv', mark: 'BF', about: 'Non-banking financial company offering retail lending and insurance.', isVerified: true },
  { id: 'teleperformance', name: 'Teleperformance', mark: 'TP', about: 'Global customer-experience and business-process outsourcing provider.', isVerified: true },
  { id: 'vibrant-infotech', name: 'Vibrant Infotech', mark: 'VI', about: 'Patna-based back-office and data services company.', isVerified: true },
  { id: 'hdfc-sales', name: 'HDFC Sales', mark: 'HF', about: 'Distribution arm for retail banking products.', isVerified: true },
  { id: 'flipkart', name: 'Flipkart', mark: 'FK', about: 'E-commerce marketplace and logistics network.', isVerified: true },
  { id: 'byjus', name: 'Byju’s', mark: 'BY', about: 'Education technology company.', isVerified: true }
];

/** @type {import('./schema.js').Job[]} */
export const jobs = [
  {
    id: 'bajaj-field-sales', slug: 'field-sales-executive-patna', title: 'Field Sales Executive',
    companyId: 'bajaj-finserv', location: 'Patna, Bihar', wfh: false,
    salaryMin: 216000, salaryMax: 288000, qualification: '12th', experienceMin: 0,
    jobType: 'Full-time', industry: 'Banking & finance', openings: 24,
    jd: 'Meet prospective customers in an assigned Patna territory, explain retail lending products and complete onboarding documentation. Freshers are welcome.',
    responsibilities: ['Generate leads in assigned territory', 'Complete KYC and loan documentation', 'Meet monthly acquisition targets'],
    expiresOn: '2026-09-22', isActive: true, featured: true, postedOn: '2026-08-30'
  },
  {
    id: 'tp-support-hindi', slug: 'customer-support-hindi-work-from-home', title: 'Customer Support (Hindi)',
    companyId: 'teleperformance', location: 'Work from home', wfh: true,
    salaryMin: 198000, salaryMax: 198000, qualification: 'Graduate', experienceMin: 0,
    jobType: 'Full-time', industry: 'Customer support', openings: 60,
    jd: 'Resolve customer queries in Hindi over voice and chat within defined response times. Open to graduates from any stream.',
    responsibilities: ['Handle Hindi voice and chat queues', 'Escalate unresolved issues', 'Maintain CSAT above target'],
    expiresOn: '2026-09-25', isActive: true, featured: true, postedOn: '2026-08-28'
  },
  {
    id: 'vibrant-data-entry', slug: 'data-entry-operator-patna', title: 'Data Entry Operator',
    companyId: 'vibrant-infotech', location: 'Boring Road, Patna, Bihar', wfh: false,
    salaryMin: 168000, salaryMax: 168000, qualification: '12th', experienceMin: 0,
    jobType: 'Full-time', industry: 'Back office', openings: 12,
    jd: 'Enter and verify records in client systems from the Boring Road office. Requires a typing speed of at least 30 words per minute.',
    responsibilities: ['Enter records accurately from source documents', 'Verify and correct flagged entries', 'Meet daily throughput targets'],
    expiresOn: '2026-09-19', isActive: true, featured: true, postedOn: '2026-08-29'
  },
  {
    id: 'flipkart-warehouse', slug: 'warehouse-associate-patna', title: 'Warehouse Associate',
    companyId: 'flipkart', location: 'Patna, Bihar', wfh: false,
    salaryMin: 168000, salaryMax: 216000, qualification: '10th', experienceMin: 0,
    jobType: 'Full-time', industry: 'Logistics', openings: 40,
    jd: 'Pick, pack and dispatch customer orders in a fulfilment centre on rotational shifts.',
    responsibilities: ['Scan and sort inbound stock', 'Pack orders to quality standard', 'Meet hourly throughput'],
    expiresOn: '2026-09-30', isActive: true, featured: false, postedOn: '2026-08-27'
  },
  {
    id: 'byjus-counsellor', slug: 'academic-counsellor-patna', title: 'Academic Counsellor',
    companyId: 'byjus', location: 'Patna, Bihar', wfh: false,
    salaryMin: 240000, salaryMax: 360000, qualification: 'Graduate', experienceMin: 0,
    jobType: 'Full-time', industry: 'Education', openings: 8,
    jd: 'Counsel parents and students on learning programmes and close enrolments over calls and home visits.',
    responsibilities: ['Call assigned leads daily', 'Conduct product demonstrations', 'Close monthly enrolment target'],
    expiresOn: '2026-09-15', isActive: true, featured: false, postedOn: '2026-08-26'
  }
];

export const skillCourses = [
  { id: 'digital-marketing', title: 'Digital Marketing', durationWeeks: 6, mode: 'Online + Patna centre', fee: 14000, placementSupport: true, nextBatchDate: '2026-09-15', syllabus: ['SEO fundamentals', 'Meta & Google Ads', 'Analytics reporting'] },
  { id: 'tally-gst', title: 'Tally + GST', durationWeeks: 8, mode: 'Patna centre', fee: 9000, placementSupport: true, nextBatchDate: '2026-09-08', syllabus: ['Accounting entries', 'GST returns', 'Payroll basics'] },
  { id: 'spoken-english', title: 'Spoken English', durationWeeks: 12, mode: 'Online', fee: 6500, placementSupport: false, nextBatchDate: '2026-09-05', syllabus: ['Everyday conversation', 'Workplace English', 'Interview fluency'] },
  { id: 'interview-prep', title: 'Interview Prep', durationWeeks: 2, mode: 'Online — mock interview + resume review', fee: 3500, placementSupport: true, nextBatchDate: '2026-09-02', syllabus: ['Resume writing', 'Mock interviews', 'Salary negotiation'] }
];
