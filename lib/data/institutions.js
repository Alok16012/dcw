/** DEMO DATA — indicative figures only. See lib/data/schema.js. */

const ug = (name, stream, months, mode, totalFee, mrpFee, emiMonthly, deadline, extra = {}) => ({
  id: `${name}-${stream}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name, stream, durationMonths: months, mode, totalFee, mrpFee,
  emiAvailable: emiMonthly != null, emiMonthly, seats: null,
  eligibility: '10+2 from a recognised board', examAccepted: [], deadline,
  level: 'UG', ...extra
});

/** @type {import('./schema.js').Institution[]} */
export const institutions = [
  {
    id: 'amity-online', vertical: 'distance', slug: 'amity-online', name: 'Amity University Online',
    mark: 'AU', type: 'Private university', city: 'Noida', state: 'Uttar Pradesh', country: 'India',
    established: 2005, rating: 4.4, reviews: 1284, nirfRank: null, featuredPriority: 95, isActive: true,
    description: 'Online degree programmes with recorded lectures, weekend live sessions and placement support.',
    approvals: [
      { body: 'UGC-DEB', grade: 'Entitled', validTill: '2027-06-30', certificateUrl: null },
      { body: 'NAAC', grade: 'A+', validTill: '2028-01-31', certificateUrl: null }
    ],
    courses: [
      ug('Online MBA', 'Management', 24, '100% online', 149000, 180000, 6208, '28 Aug', { level: 'PG' }),
      ug('Online BBA', 'Management', 36, '100% online', 129000, 148000, 3583, '28 Aug')
    ],
    cutoffs: [], placement: { year: 2025, highestPkg: 1800000, averagePkg: 520000, medianPkg: 450000, topRecruiters: ['Amazon', 'Byjus', 'HDFC Bank'] }
  },
  {
    id: 'manipal-online', vertical: 'distance', slug: 'manipal-online', name: 'Manipal University Jaipur',
    mark: 'MU', type: 'Private university', city: 'Jaipur', state: 'Rajasthan', country: 'India',
    established: 2011, rating: 4.7, reviews: 946, nirfRank: null, featuredPriority: 85, isActive: true,
    description: 'Online UG and PG degrees with proctored online exams and an alumni network across India.',
    approvals: [
      { body: 'UGC-DEB', grade: 'Entitled', validTill: '2027-06-30', certificateUrl: null },
      { body: 'NAAC', grade: 'A+', validTill: '2027-09-30', certificateUrl: null }
    ],
    courses: [ug('Online BCA', 'IT', 36, 'Online', 135000, 150000, 5625, '31 Aug')],
    cutoffs: [], placement: { year: 2025, highestPkg: 1400000, averagePkg: 480000, medianPkg: 420000, topRecruiters: ['Infosys', 'Wipro', 'TCS'] }
  },
  {
    id: 'cu-online', vertical: 'distance', slug: 'cu-online', name: 'Chandigarh University Online',
    mark: 'CU', type: 'Private university', city: 'Mohali', state: 'Punjab', country: 'India',
    established: 2012, rating: 4.6, reviews: 872, nirfRank: null, featuredPriority: 70, isActive: true,
    description: 'Flexible online degrees with a mobile-first learning app and recorded backup classes.',
    approvals: [
      { body: 'UGC-DEB', grade: 'Entitled', validTill: '2027-06-30', certificateUrl: null },
      { body: 'NAAC', grade: 'A+', validTill: '2027-12-31', certificateUrl: null }
    ],
    courses: [ug('Online BBA', 'Management', 36, 'Online', 109200, 124000, 4550, '24 Aug')],
    cutoffs: [], placement: null
  },
  {
    id: 'ignou', vertical: 'distance', slug: 'ignou', name: 'IGNOU',
    mark: 'IG', type: 'Central university', city: 'New Delhi', state: 'Delhi', country: 'India',
    established: 1985, rating: 4.5, reviews: 3421, nirfRank: null, featuredPriority: 86, isActive: true,
    description: 'India’s national open university. Lowest fees, widest recognition, self-paced study.',
    approvals: [
      { body: 'UGC-DEB', grade: 'Entitled', validTill: '2028-06-30', certificateUrl: null },
      { body: 'NAAC', grade: 'A++', validTill: '2028-03-31', certificateUrl: null }
    ],
    courses: [ug('BA (General)', 'Arts', 36, 'Distance', 16200, null, null, '30 Sep')],
    cutoffs: [], placement: null
  },
  {
    id: 'lpu', vertical: 'distance', slug: 'lpu', name: 'Lovely Professional University',
    mark: 'LP', type: 'Private university', city: 'Jalandhar', state: 'Punjab', country: 'India',
    established: 2005, rating: 4.2, reviews: 721, nirfRank: null, featuredPriority: 88, isActive: true,
    description: 'Distance and online degrees with industry-aligned electives and interview preparation support.',
    approvals: [
      { body: 'UGC-DEB', grade: 'Entitled', validTill: '2027-06-30', certificateUrl: null },
      { body: 'AICTE', grade: 'Approved', validTill: '2027-03-31', certificateUrl: null }
    ],
    courses: [ug('Distance BBA', 'Management', 36, 'Distance', 78000, 92000, 3250, '02 Sep')],
    cutoffs: [], placement: null
  },
  {
    id: 'jain-online', vertical: 'distance', slug: 'jain-online', name: 'JAIN Online',
    mark: 'JA', type: 'Deemed university', city: 'Bengaluru', state: 'Karnataka', country: 'India',
    established: 2009, rating: 4.4, reviews: 512, nirfRank: null, featuredPriority: 40, isActive: true,
    description: 'Online degrees with live doubt-clearing and an in-house placement cell.',
    approvals: [
      { body: 'UGC-DEB', grade: 'Entitled', validTill: '2027-06-30', certificateUrl: null },
      { body: 'NAAC', grade: 'A+', validTill: '2027-08-31', certificateUrl: null }
    ],
    courses: [ug('Online BCom', 'Commerce', 36, 'Online', 120000, 135000, 5000, '12 Sep')],
    cutoffs: [], placement: null
  },

  {
    id: 'gmc-patna', vertical: 'colleges', slug: 'gmc-patna', name: 'Government Medical College',
    mark: 'GM', type: 'Government', city: 'Patna', state: 'Bihar', country: 'India',
    established: 1925, rating: 4.3, reviews: 486, nirfRank: 42, featuredPriority: 96, isActive: true,
    description: 'State government medical college with attached teaching hospital and on-campus hostel.',
    approvals: [{ body: 'NMC', grade: 'Approved', validTill: '2029-03-31', certificateUrl: null }],
    courses: [{ ...ug('MBBS', 'Medical', 66, 'Regular', 654000, null, null, 'Bihar UGMAC'), seats: 100, examAccepted: ['NEET-UG'], eligibility: '10+2 PCB, NEET score 610+' }],
    cutoffs: [{ year: 2025, category: 'Gen', closingRank: 18420 }, { year: 2025, category: 'OBC', closingRank: 29650 }],
    placement: null
  },
  {
    id: 'tbilisi-smu', vertical: 'colleges', slug: 'tbilisi-smu', name: 'Tbilisi State Medical University',
    mark: 'TS', type: 'Government', city: 'Tbilisi', state: null, country: 'Georgia',
    established: 1918, rating: 4.1, reviews: 302, nirfRank: null, featuredPriority: 94, isActive: true,
    description: 'NMC-listed Georgian medical university. Direct admission, no donation, FMGE coaching bundled.',
    approvals: [{ body: 'NMC', grade: 'Listed', validTill: '2029-12-31', certificateUrl: null }],
    courses: [{ ...ug('MD (MBBS)', 'Medical', 72, 'Regular', 2400000, null, null, 'September intake'), seats: null, examAccepted: ['NEET-UG'], eligibility: '10+2 PCB, NEET qualified' }],
    cutoffs: [], placement: null
  },
  {
    id: 'nit-patna', vertical: 'colleges', slug: 'nit-patna', name: 'NIT Patna',
    mark: 'NP', type: 'Government', city: 'Patna', state: 'Bihar', country: 'India',
    established: 1886, rating: 4.4, reviews: 551, nirfRank: 56, featuredPriority: 92, isActive: true,
    description: 'Institute of National Importance. Admission through JEE Main via JoSAA counselling.',
    approvals: [{ body: 'AICTE', grade: 'Approved', validTill: '2028-03-31', certificateUrl: null }],
    courses: [{ ...ug('B.Tech CSE', 'Engineering', 48, 'Regular', 520000, null, null, 'JoSAA Round 1'), seats: 120, examAccepted: ['JEE Main'], eligibility: '10+2 PCM, JEE Main 92 percentile' }],
    cutoffs: [{ year: 2025, category: 'Gen', closingRank: 18900 }],
    placement: { year: 2025, highestPkg: 5400000, averagePkg: 1240000, medianPkg: 1100000, topRecruiters: ['Microsoft', 'Amazon', 'Samsung'] }
  },
  {
    id: 'aiims-patna', vertical: 'colleges', slug: 'aiims-patna', name: 'AIIMS Patna',
    mark: 'AI', type: 'Government', city: 'Patna', state: 'Bihar', country: 'India',
    established: 2012, rating: 4.9, reviews: 614, nirfRank: 24, featuredPriority: 95, isActive: true,
    description: 'Institute of National Importance. Admission through NEET-UG via MCC counselling.',
    approvals: [
      { body: 'NMC', grade: 'Approved', validTill: '2029-03-31', certificateUrl: null },
      { body: 'INI', grade: 'Institute of National Importance', validTill: null, certificateUrl: null }
    ],
    courses: [{ ...ug('MBBS', 'Medical', 66, 'Regular', 7640, null, null, 'MCC Round 1'), seats: 125, examAccepted: ['NEET-UG'], eligibility: '10+2 PCB, NEET qualified' }],
    cutoffs: [
      { year: 2025, category: 'Gen', closingRank: 1947 }, { year: 2025, category: 'OBC', closingRank: 3120 },
      { year: 2025, category: 'SC', closingRank: 14880 }, { year: 2024, category: 'Gen', closingRank: 2104 }
    ],
    placement: null
  },
  {
    id: 'igims-patna', vertical: 'colleges', slug: 'igims-patna', name: 'IGIMS Patna',
    mark: 'IG', type: 'Government', city: 'Patna', state: 'Bihar', country: 'India',
    established: 1983, rating: 4.7, reviews: 433, nirfRank: null, featuredPriority: 75, isActive: true,
    description: 'State government medical institute. Bihar UGMAC counselling for state quota seats.',
    approvals: [{ body: 'NMC', grade: 'Approved', validTill: '2028-03-31', certificateUrl: null }],
    courses: [{ ...ug('MBBS', 'Medical', 66, 'Regular', 84200, null, null, 'Bihar UGMAC'), seats: 120, examAccepted: ['NEET-UG'], eligibility: '10+2 PCB, NEET qualified' }],
    cutoffs: [{ year: 2025, category: 'Gen', closingRank: 7321 }, { year: 2025, category: 'OBC', closingRank: 11040 }],
    placement: null
  },
  {
    id: 'kmc-manipal', vertical: 'colleges', slug: 'kmc-manipal', name: 'Kasturba Medical College',
    mark: 'KM', type: 'Deemed', city: 'Manipal', state: 'Karnataka', country: 'India',
    established: 1953, rating: 4.8, reviews: 911, nirfRank: 11, featuredPriority: 88, isActive: true,
    description: 'Long-established deemed medical university with teaching hospitals on campus.',
    approvals: [
      { body: 'NMC', grade: 'Approved', validTill: '2029-03-31', certificateUrl: null },
      { body: 'NAAC', grade: 'A++', validTill: '2028-06-30', certificateUrl: null }
    ],
    courses: [{ ...ug('MBBS', 'Medical', 66, 'Regular', 7070000, null, null, 'MCC Deemed'), seats: 250, examAccepted: ['NEET-UG'], eligibility: '10+2 PCB, NEET qualified' }],
    cutoffs: [{ year: 2025, category: 'Gen', closingRank: 51240 }],
    placement: null
  },
  {
    id: 'nmch-sasaram', vertical: 'colleges', slug: 'nmch-sasaram', name: 'Narayan Medical College',
    mark: 'NM', type: 'Private', city: 'Sasaram', state: 'Bihar', country: 'India',
    established: 2006, rating: 4.3, reviews: 287, nirfRank: null, featuredPriority: 30, isActive: true,
    description: 'Private medical college in Bihar with attached teaching hospital.',
    approvals: [{ body: 'NMC', grade: 'Approved', validTill: '2027-03-31', certificateUrl: null }],
    courses: [{ ...ug('MBBS', 'Medical', 66, 'Regular', 5200000, null, null, 'Bihar UGMAC'), seats: 150, examAccepted: ['NEET-UG'], eligibility: '10+2 PCB, NEET qualified' }],
    cutoffs: [{ year: 2025, category: 'Gen', closingRank: 142300 }],
    placement: null
  },
  {
    id: 'dypatil-pune', vertical: 'colleges', slug: 'dypatil-pune', name: 'Dr. D.Y. Patil Medical College',
    mark: 'DY', type: 'Deemed', city: 'Pune', state: 'Maharashtra', country: 'India',
    established: 1996, rating: 4.6, reviews: 702, nirfRank: 46, featuredPriority: 65, isActive: true,
    description: 'Deemed university medical college with hostel and multi-speciality hospital.',
    approvals: [
      { body: 'NMC', grade: 'Approved', validTill: '2028-03-31', certificateUrl: null },
      { body: 'NAAC', grade: 'A++', validTill: '2027-11-30', certificateUrl: null }
    ],
    courses: [{ ...ug('MBBS', 'Medical', 66, 'Regular', 6400000, null, null, 'MCC Deemed'), seats: 250, examAccepted: ['NEET-UG'], eligibility: '10+2 PCB, NEET qualified' }],
    cutoffs: [{ year: 2025, category: 'Gen', closingRank: 62800 }],
    placement: null
  }
];
