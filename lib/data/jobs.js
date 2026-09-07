/**
 * DEMO DATA — indicative figures only. See lib/data/schema.js.
 *
 * This table is the single source of truth for Berojgar Bharat. It feeds
 * lib/jobs-repo.js (which the admin console mutates), lib/store.js and the
 * /api/jobs routes, and through them the public listing — so a job posted in
 * /admin appears publicly without a second copy existing anywhere.
 *
 * Coordinates are approximate locality centroids. They exist because "jobs near
 * me" ranks by real great-circle distance; a role without them still lists, it
 * simply carries no distance, exactly like a remote one.
 */
/** @type {import('./schema.js').Company[]} */
export const companies = [
  { id: 'bajaj-finserv', name: 'Bajaj Finserv', mark: 'BF', isVerified: true, rating: 4.6, reviews: 203,
    about: 'Non-banking financial company offering retail lending and insurance.' },
  { id: 'teleperformance', name: 'Teleperformance', mark: 'TP', isVerified: true, rating: 4.5, reviews: 188,
    about: 'Global customer-experience and business-process outsourcing provider.' },
  { id: 'vibrant-infotech', name: 'Vibrant Infotech', mark: 'VI', isVerified: true, rating: 4.3, reviews: 91,
    about: 'Patna-based back-office and data services company.' },
  { id: 'taxcare-india', name: 'Taxcare India', mark: 'TC', isVerified: true, rating: 4.4, reviews: 79,
    about: 'Accounting, GST filing and compliance practice serving Bihar SMEs.' },
  { id: 'nexa-services', name: 'Nexa Services', mark: 'NX', isVerified: true, rating: 4.3, reviews: 91,
    about: 'Inside-sales and tele-support outsourcing firm operating from Patna.' },
  { id: 'zippy-logistics', name: 'Zippy Logistics', mark: 'ZP', isVerified: true, rating: 4.1, reviews: 64,
    about: 'Last-mile delivery network across Jharkhand and Bihar.' },
  { id: 'reliance-trends', name: 'Reliance Trends', mark: 'RB', isVerified: true, rating: 4.4, reviews: 132,
    about: 'Fashion retail chain under Reliance Retail.' },
  { id: 'concentrix', name: 'Concentrix', mark: 'CV', isVerified: true, rating: 4.5, reviews: 412,
    about: 'International customer-experience outsourcing provider.' },
  { id: 'hdb-financial', name: 'HDB Financial', mark: 'HD', isVerified: true, rating: 4.2, reviews: 97,
    about: 'Non-banking lender offering secured and unsecured retail loans.' },
  { id: 'zerofold-labs', name: 'Zerofold Labs', mark: 'ZE', isVerified: true, rating: 4.7, reviews: 58,
    about: 'Product engineering studio building web applications for Indian startups.' },
  { id: 'qbridge-systems', name: 'Qbridge Systems', mark: 'QB', isVerified: true, rating: 4.3, reviews: 44,
    about: 'Software testing and quality-engineering services company.' },
  { id: 'wellness-mart', name: 'Wellness Mart', mark: 'WM', isVerified: true, rating: 4.2, reviews: 37,
    about: 'Retail pharmacy and wellness chain.' },
  { id: 'brightcurve-media', name: 'Brightcurve Media', mark: 'BC', isVerified: true, rating: 4.4, reviews: 29,
    about: 'Performance-marketing agency for consumer brands.' },
  { id: 'sunglow-services', name: 'Sunglow Services', mark: 'SG', isVerified: true, rating: 4.0, reviews: 52,
    about: 'Business-process support provider for insurance and telecom clients.' },
  { id: 'inkspan', name: 'Inkspan', mark: 'IN', isVerified: true, rating: 4.6, reviews: 71,
    about: 'Content studio producing Hindi and English editorial for digital publishers.' },
  { id: 'medicare-diagnostics', name: 'Medicare Diagnostics', mark: 'MD', isVerified: true, rating: 4.3, reviews: 33,
    about: 'Pathology laboratory network across eastern India.' },
  { id: 'axis-bank-bc', name: 'Axis Bank BC', mark: 'AB', isVerified: true, rating: 4.1, reviews: 88,
    about: 'Business-correspondent partner distributing Axis Bank retail products.' },
  { id: 'gati-supply-co', name: 'Gati Supply Co', mark: 'GS', isVerified: true, rating: 4.2, reviews: 41,
    about: 'Third-party warehousing and surface transport operator.' },
  { id: 'flipkart', name: 'Flipkart', mark: 'FK', isVerified: true, rating: 4.2, reviews: 310,
    about: 'E-commerce marketplace and logistics network.' },
  { id: 'byjus', name: 'Byju’s', mark: 'BY', isVerified: true, rating: 3.9, reviews: 240,
    about: 'Education technology company.' },
];

/** @type {import('./schema.js').Job[]} */
export const jobs = [
  {
    id: 'field-sales-executive-patna', slug: 'field-sales-executive-patna', title: 'Field Sales Executive', companyId: 'bajaj-finserv',
    location: 'Kankarbagh, Patna', city: 'Patna', area: 'Kankarbagh', lat: 25.5877, lng: 85.1591, wfh: false,
    salaryMin: 216000, salaryMax: 288000, qualification: '12th', eligibility: '12th pass • Freshers ok', experienceMin: 0,
    jobType: 'Full-time', industry: 'Sales', roleType: 'Field sales', openings: 24,
    tags: ['Verified company', 'Freshers welcome'],
    jd: 'Meet prospective customers in an assigned Patna territory, explain retail lending products and complete onboarding documentation. Freshers are welcome.',
    responsibilities: [
      'Generate leads in the assigned territory',
      'Complete KYC and loan documentation',
      'Meet monthly acquisition targets',
    ],
    expiresOn: '2026-09-22', deadlineLabel: null,
    isActive: true, featured: true, postedOn: '2026-09-02'
  },
  {
    id: 'customer-support-hindi-remote', slug: 'customer-support-hindi-remote', title: 'Customer Support (Hindi)', companyId: 'teleperformance',
    location: 'Work from home', city: 'Remote', area: null, lat: null, lng: null, wfh: true,
    salaryMin: 198000, salaryMax: 198000, qualification: 'Graduate', eligibility: 'Graduate • Any stream', experienceMin: 0,
    jobType: 'Full-time', industry: 'Support', roleType: 'Voice & chat support', openings: 60,
    tags: ['Verified company', 'Work from home'],
    jd: 'Resolve customer queries in Hindi over voice and chat within defined response times. Open to graduates from any stream. Laptop and broadband required.',
    responsibilities: [
      'Handle Hindi voice and chat queues',
      'Escalate unresolved issues to the right desk',
      'Maintain CSAT above the team target',
    ],
    expiresOn: '2026-09-25', deadlineLabel: null,
    isActive: true, featured: true, postedOn: '2026-09-03'
  },
  {
    id: 'data-entry-operator-patna', slug: 'data-entry-operator-patna', title: 'Data Entry Operator', companyId: 'vibrant-infotech',
    location: 'Boring Road, Patna', city: 'Patna', area: 'Boring Road', lat: 25.621, lng: 85.108, wfh: false,
    salaryMin: 168000, salaryMax: 168000, qualification: '12th', eligibility: '12th + typing 30 wpm', experienceMin: 0,
    jobType: 'Full-time', industry: 'Operations', roleType: 'Back office', openings: 12,
    tags: ['Verified company', 'Walk-in'],
    jd: 'Enter and verify records in client systems from the Boring Road office. Requires a typing speed of at least 30 words per minute.',
    responsibilities: [
      'Enter records accurately from source documents',
      'Verify and correct flagged entries',
      'Meet daily throughput targets',
    ],
    expiresOn: '2026-09-19', deadlineLabel: 'Walk-in 19 Sep',
    isActive: true, featured: true, postedOn: '2026-08-31'
  },
  {
    id: 'tally-accountant', slug: 'tally-accountant', title: 'Junior Accounts Assistant', companyId: 'taxcare-india',
    location: 'Exhibition Road, Patna', city: 'Patna', area: 'Exhibition Road', lat: 25.61, lng: 85.137, wfh: false,
    salaryMin: 216000, salaryMax: 312000, qualification: 'Graduate', eligibility: 'B.Com • Tally', experienceMin: 0,
    jobType: 'Full-time', industry: 'Finance', roleType: 'Accounts', openings: 6,
    tags: ['Salary verified', 'Fresher'],
    jd: 'Maintain day books, reconcile ledgers and prepare GST working files in Tally for a portfolio of small-business clients.',
    responsibilities: [
      'Post purchase and sales entries in Tally',
      'Reconcile bank and vendor ledgers monthly',
      'Prepare GSTR-1 and GSTR-3B working files',
    ],
    expiresOn: '2026-09-29', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-29'
  },
  {
    id: 'telecaller', slug: 'telecaller', title: 'Hindi Telecaller', companyId: 'nexa-services',
    location: 'Bailey Road, Patna', city: 'Patna', area: 'Bailey Road', lat: 25.612, lng: 85.09, wfh: false,
    salaryMin: 168000, salaryMax: 240000, qualification: '12th', eligibility: '12th pass', experienceMin: 0,
    jobType: 'Full-time', industry: 'Sales', roleType: 'Inside sales', openings: 22,
    tags: ['Verified company', 'Women preferred'],
    jd: 'Call assigned prospects in Hindi, explain the client’s product and book appointments for the field team. Day shift only.',
    responsibilities: [
      'Complete the assigned daily call list',
      'Record call outcomes in the CRM',
      'Book qualified appointments for field staff',
    ],
    expiresOn: '2026-09-21', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-09-01'
  },
  {
    id: 'delivery-partner-ranchi', slug: 'delivery-partner-ranchi', title: 'Delivery Partner', companyId: 'zippy-logistics',
    location: 'Lalpur, Ranchi', city: 'Ranchi', area: 'Lalpur', lat: 23.376, lng: 85.333, wfh: false,
    salaryMin: 180000, salaryMax: 264000, qualification: '10th', eligibility: '10th pass • Own two-wheeler', experienceMin: 0,
    jobType: 'Part-time', industry: 'Logistics', roleType: 'Field delivery', openings: 40,
    tags: ['Verified company', 'Daily payout'],
    jd: 'Deliver customer orders within an assigned Ranchi zone using your own two-wheeler. Fuel allowance and daily payout.',
    responsibilities: [
      'Collect and deliver orders on the assigned route',
      'Confirm delivery and collect cash where applicable',
      'Maintain the delivery success rate above target',
    ],
    expiresOn: '2026-09-30', deadlineLabel: 'Walk-in daily',
    isActive: true, featured: false, postedOn: '2026-09-03'
  },
  {
    id: 'retail-store-associate-lucknow', slug: 'retail-store-associate-lucknow', title: 'Retail Store Associate', companyId: 'reliance-trends',
    location: 'Gomti Nagar, Lucknow', city: 'Lucknow', area: 'Gomti Nagar', lat: 26.85, lng: 81.0, wfh: false,
    salaryMin: 192000, salaryMax: 252000, qualification: '12th', eligibility: '12th pass • Freshers ok', experienceMin: 0,
    jobType: 'Full-time', industry: 'Retail', roleType: 'Store floor', openings: 18,
    tags: ['Verified company', 'Freshers welcome'],
    jd: 'Assist customers on the shop floor, maintain merchandise displays and operate the billing counter on a rotational shift.',
    responsibilities: [
      'Help customers find and try merchandise',
      'Keep displays stocked and correctly sized',
      'Operate the billing counter accurately',
    ],
    expiresOn: '2026-09-27', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-30'
  },
  {
    id: 'bpo-voice-associate-noida', slug: 'bpo-voice-associate-noida', title: 'International Voice Associate', companyId: 'concentrix',
    location: 'Sector 62, Noida, Delhi NCR', city: 'Delhi NCR', area: 'Sector 62, Noida', lat: 28.627, lng: 77.372, wfh: false,
    salaryMin: 300000, salaryMax: 420000, qualification: 'Graduate', eligibility: 'Graduate • Fluent English', experienceMin: 0,
    jobType: 'Full-time', industry: 'Support', roleType: 'Night shift', openings: 75,
    tags: ['Salary verified', 'Cab facility'],
    jd: 'Support international customers over voice on a night-shift roster. Requires fluent, neutral-accent English. Two-way cab provided.',
    responsibilities: [
      'Handle inbound international voice queues',
      'Document each interaction in the case system',
      'Meet quality and average-handling-time targets',
    ],
    expiresOn: '2026-09-30', deadlineLabel: null,
    isActive: true, featured: true, postedOn: '2026-09-02'
  },
  {
    id: 'field-collections-gurugram', slug: 'field-collections-gurugram', title: 'Collections Officer', companyId: 'hdb-financial',
    location: 'Udyog Vihar, Gurugram', city: 'Gurugram', area: 'Udyog Vihar', lat: 28.503, lng: 77.087, wfh: false,
    salaryMin: 264000, salaryMax: 384000, qualification: 'Graduate', eligibility: 'Graduate • 0–2 yrs', experienceMin: 0,
    jobType: 'Full-time', industry: 'Finance', roleType: 'Field collections', openings: 14,
    tags: ['Verified company', 'Incentives'],
    jd: 'Visit delinquent retail-loan customers in an assigned Gurugram territory, negotiate repayment and record commitments.',
    responsibilities: [
      'Visit assigned overdue accounts daily',
      'Negotiate and record repayment commitments',
      'Deposit collections the same working day',
    ],
    expiresOn: '2026-09-24', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-28'
  },
  {
    id: 'junior-frontend-bengaluru', slug: 'junior-frontend-bengaluru', title: 'Junior Frontend Developer', companyId: 'zerofold-labs',
    location: 'Koramangala, Bengaluru', city: 'Bengaluru', area: 'Koramangala', lat: 12.9352, lng: 77.6245, wfh: false,
    salaryMin: 420000, salaryMax: 624000, qualification: 'Graduate', eligibility: 'BCA / B.Tech • React', experienceMin: 0,
    jobType: 'Full-time', industry: 'Technology', roleType: 'Hybrid', openings: 4,
    tags: ['Salary verified', 'Learning budget'],
    jd: 'Build and maintain React interfaces for client products alongside a senior engineer. Three days a week in the Koramangala office.',
    responsibilities: [
      'Implement UI from designs in React',
      'Fix defects raised in code review and QA',
      'Write component tests for new work',
    ],
    expiresOn: '2026-09-28', deadlineLabel: null,
    isActive: true, featured: true, postedOn: '2026-09-01'
  },
  {
    id: 'qa-trainee-hyderabad', slug: 'qa-trainee-hyderabad', title: 'QA Trainee', companyId: 'qbridge-systems',
    location: 'Madhapur, Hyderabad', city: 'Hyderabad', area: 'Madhapur', lat: 17.4483, lng: 78.3915, wfh: false,
    salaryMin: 288000, salaryMax: 384000, qualification: 'Graduate', eligibility: 'Any graduate • Trained', experienceMin: 0,
    jobType: 'Full-time', industry: 'Technology', roleType: 'On-site', openings: 10,
    tags: ['Verified company', 'Paid training'],
    jd: 'Execute manual test cases on client web applications and log defects. Eight weeks of paid training before project allocation.',
    responsibilities: [
      'Execute assigned test cases and record results',
      'Log and re-verify defects',
      'Prepare daily test-execution summaries',
    ],
    expiresOn: '2026-09-26', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-27'
  },
  {
    id: 'pharmacy-assistant-mumbai', slug: 'pharmacy-assistant-mumbai', title: 'Pharmacy Assistant', companyId: 'wellness-mart',
    location: 'Andheri East, Mumbai', city: 'Mumbai', area: 'Andheri East', lat: 19.1136, lng: 72.8697, wfh: false,
    salaryMin: 240000, salaryMax: 312000, qualification: 'Graduate', eligibility: 'D.Pharm • Registered', experienceMin: 0,
    jobType: 'Full-time', industry: 'Healthcare', roleType: 'Shift roster', openings: 8,
    tags: ['Verified company', 'ESI + PF'],
    jd: 'Dispense prescriptions under the supervising pharmacist, manage stock rotation and advise customers on over-the-counter products. Requires a valid D.Pharm registration.',
    responsibilities: [
      'Dispense prescriptions accurately',
      'Manage stock rotation and expiry checks',
      'Maintain the schedule-H register',
    ],
    expiresOn: '2026-09-23', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-31'
  },
  {
    id: 'digital-marketing-intern-pune', slug: 'digital-marketing-intern-pune', title: 'Digital Marketing Intern', companyId: 'brightcurve-media',
    location: 'Baner, Pune', city: 'Pune', area: 'Baner', lat: 18.559, lng: 73.7868, wfh: false,
    salaryMin: 144000, salaryMax: 144000, qualification: 'Any', eligibility: 'Any stream • Final year ok', experienceMin: 0,
    jobType: 'Internship', industry: 'Marketing', roleType: 'Hybrid internship', openings: 6,
    tags: ['Verified company', 'PPO possible'],
    jd: 'Six-month paid internship supporting paid-social and search campaigns for consumer brands. Final-year students may apply.',
    responsibilities: [
      'Build campaign reports from ad platforms',
      'Draft ad copy and creative briefs',
      'Track competitor activity weekly',
    ],
    expiresOn: '2026-09-20', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-09-03'
  },
  {
    id: 'back-office-executive-jaipur', slug: 'back-office-executive-jaipur', title: 'Back Office Executive', companyId: 'sunglow-services',
    location: 'Malviya Nagar, Jaipur', city: 'Jaipur', area: 'Malviya Nagar', lat: 26.8535, lng: 75.81, wfh: false,
    salaryMin: 156000, salaryMax: 204000, qualification: '12th', eligibility: '12th pass • Basic computer', experienceMin: 0,
    jobType: 'Full-time', industry: 'Operations', roleType: 'Back office', openings: 16,
    tags: ['Verified company', 'Day shift'],
    jd: 'Process insurance and telecom service requests in client systems on a day shift. Basic computer familiarity is enough; training is provided.',
    responsibilities: [
      'Process service requests within the agreed turnaround',
      'Verify supporting documents',
      'Flag exceptions to the team lead',
    ],
    expiresOn: '2026-09-30', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-26'
  },
  {
    id: 'content-writer-remote', slug: 'content-writer-remote', title: 'Content Writer (Hindi/English)', companyId: 'inkspan',
    location: 'Work from home', city: 'Remote', area: null, lat: null, lng: null, wfh: true,
    salaryMin: 180000, salaryMax: 264000, qualification: 'Graduate', eligibility: 'Any graduate • Portfolio', experienceMin: 0,
    jobType: 'Part-time', industry: 'Marketing', roleType: 'Freelance-friendly', openings: 9,
    tags: ['Verified company', 'Work from home'],
    jd: 'Write and edit Hindi and English articles for digital publishers on a part-time, remote basis. Share a portfolio or two writing samples when applying.',
    responsibilities: [
      'Write assigned articles to the house style guide',
      'Edit and fact-check drafts before submission',
      'Meet agreed weekly word-count commitments',
    ],
    expiresOn: '2026-10-31', deadlineLabel: 'Rolling',
    isActive: true, featured: false, postedOn: '2026-09-02'
  },
  {
    id: 'lab-technician-bhubaneswar', slug: 'lab-technician-bhubaneswar', title: 'Lab Technician', companyId: 'medicare-diagnostics',
    location: 'Saheed Nagar, Bhubaneswar', city: 'Bhubaneswar', area: 'Saheed Nagar', lat: 20.29, lng: 85.846, wfh: false,
    salaryMin: 192000, salaryMax: 264000, qualification: 'Graduate', eligibility: 'DMLT • Freshers ok', experienceMin: 0,
    jobType: 'Full-time', industry: 'Healthcare', roleType: 'On-site', openings: 5,
    tags: ['Verified company', 'Freshers welcome'],
    jd: 'Collect samples and run routine haematology and biochemistry tests in a Bhubaneswar laboratory. DMLT freshers are welcome.',
    responsibilities: [
      'Collect and label samples correctly',
      'Run routine analyser panels and record results',
      'Maintain equipment calibration logs',
    ],
    expiresOn: '2026-09-27', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-29'
  },
  {
    id: 'relationship-officer-kolkata', slug: 'relationship-officer-kolkata', title: 'Relationship Officer', companyId: 'axis-bank-bc',
    location: 'Salt Lake, Kolkata', city: 'Kolkata', area: 'Salt Lake', lat: 22.58, lng: 88.42, wfh: false,
    salaryMin: 216000, salaryMax: 336000, qualification: 'Graduate', eligibility: 'Graduate • Freshers ok', experienceMin: 0,
    jobType: 'Full-time', industry: 'Finance', roleType: 'Branch banking', openings: 20,
    tags: ['Salary verified', 'Incentives'],
    jd: 'Open accounts and cross-sell deposit and insurance products to walk-in and referred customers at a business-correspondent branch.',
    responsibilities: [
      'Open and activate new savings accounts',
      'Cross-sell deposit and insurance products',
      'Complete KYC to bank standards',
    ],
    expiresOn: '2026-09-25', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-09-01'
  },
  {
    id: 'warehouse-supervisor-patna', slug: 'warehouse-supervisor-patna', title: 'Warehouse Supervisor', companyId: 'gati-supply-co',
    location: 'Fatuha, Patna', city: 'Patna', area: 'Fatuha', lat: 25.51, lng: 85.305, wfh: false,
    salaryMin: 228000, salaryMax: 300000, qualification: '12th', eligibility: '12th pass • 1 yr experience', experienceMin: 1,
    jobType: 'Full-time', industry: 'Logistics', roleType: 'Warehouse', openings: 3,
    tags: ['Verified company', 'PF + ESI'],
    jd: 'Supervise inbound and outbound movement at a Fatuha warehouse, manage a team of loaders and keep stock records accurate.',
    responsibilities: [
      'Supervise loading and unloading shifts',
      'Reconcile physical stock against the system',
      'Enforce safety procedures on the floor',
    ],
    expiresOn: '2026-09-26', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-30'
  },
  {
    id: 'warehouse-associate-patna', slug: 'warehouse-associate-patna', title: 'Warehouse Associate', companyId: 'flipkart',
    location: 'Patna', city: 'Patna', area: null, lat: 25.5941, lng: 85.1376, wfh: false,
    salaryMin: 168000, salaryMax: 216000, qualification: '10th', eligibility: '10th pass • Rotational shift', experienceMin: 0,
    jobType: 'Full-time', industry: 'Logistics', roleType: 'Fulfilment centre', openings: 40,
    tags: ['Verified company', 'Rotational shift'],
    jd: 'Pick, pack and dispatch customer orders in a fulfilment centre on rotational shifts.',
    responsibilities: [
      'Scan and sort inbound stock',
      'Pack orders to the quality standard',
      'Meet hourly throughput targets',
    ],
    expiresOn: '2026-09-30', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-27'
  },
  {
    id: 'academic-counsellor-patna', slug: 'academic-counsellor-patna', title: 'Academic Counsellor', companyId: 'byjus',
    location: 'Patna', city: 'Patna', area: null, lat: 25.5941, lng: 85.1376, wfh: false,
    salaryMin: 240000, salaryMax: 360000, qualification: 'Graduate', eligibility: 'Graduate • Any stream', experienceMin: 0,
    jobType: 'Full-time', industry: 'Education', roleType: 'Inside sales', openings: 8,
    tags: ['Verified company', 'Incentives'],
    jd: 'Counsel parents and students on learning programmes and close enrolments over calls and home visits.',
    responsibilities: [
      'Call assigned leads daily',
      'Conduct product demonstrations',
      'Close the monthly enrolment target',
    ],
    expiresOn: '2026-09-15', deadlineLabel: null,
    isActive: true, featured: false, postedOn: '2026-08-26'
  },
];

export const skillCourses = [
  { id: 'digital-marketing', title: 'Digital Marketing', durationWeeks: 6, mode: 'Online + Patna centre', fee: 14000, placementSupport: true, nextBatchDate: '2026-09-15', syllabus: ['SEO fundamentals', 'Meta & Google Ads', 'Analytics reporting'] },
  { id: 'tally-gst', title: 'Tally + GST', durationWeeks: 8, mode: 'Patna centre', fee: 9000, placementSupport: true, nextBatchDate: '2026-09-08', syllabus: ['Accounting entries', 'GST returns', 'Payroll basics'] },
  { id: 'spoken-english', title: 'Spoken English', durationWeeks: 12, mode: 'Online', fee: 6500, placementSupport: false, nextBatchDate: '2026-09-05', syllabus: ['Everyday conversation', 'Workplace English', 'Interview fluency'] },
  { id: 'interview-prep', title: 'Interview Prep', durationWeeks: 2, mode: 'Online — mock interview + resume review', fee: 3500, placementSupport: true, nextBatchDate: '2026-09-02', syllabus: ['Resume writing', 'Mock interviews', 'Salary negotiation'] }
];
