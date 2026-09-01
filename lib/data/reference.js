/** DEMO DATA — boards and study-abroad reference tables (PRD §5.4, §6.5). */

export const boards = [
  { id: 'nios', name: 'NIOS', recognition: 'Central board — equivalent to CBSE', examFrequency: 'Twice a year + on-demand', resultDays: 50, fee: 4800, tcRequired: false, bestFor: 'Widest acceptance for further study', acceptance: 88, speed: 60 },
  { id: 'bosse', name: 'BOSSE', recognition: 'Sikkim state board — recognised for higher study', examFrequency: 'On-demand', resultDays: 45, fee: 5500, tcRequired: false, bestFor: 'Fastest completion — result in 45 days', acceptance: 62, speed: 90 },
  { id: 'bbose', name: 'BBOSE', recognition: 'Bihar state board', examFrequency: 'On-demand', resultDays: 75, fee: 4200, tcRequired: false, bestFor: 'Bihar students who want an on-demand exam', acceptance: 45, speed: 70 },
  { id: 'cbse-patrachar', name: 'CBSE Patrachar', recognition: 'Central board, correspondence route', examFrequency: 'Once a year', resultDays: 55, fee: 6200, tcRequired: true, bestFor: 'Students who must hold a CBSE certificate', acceptance: 98, speed: 35 }
];

export const countries = [
  { id: 'georgia', name: 'Georgia', slug: 'georgia', programme: 'MBBS', totalCostMin: 2400000, totalCostMax: 2800000, intakeMonths: ['September'], approvalBody: 'NMC-listed universities', fmgePassRate: 22, languageReq: 'English-medium', durationYears: 6 },
  { id: 'russia', name: 'Russia', slug: 'russia', programme: 'MBBS', totalCostMin: 1900000, totalCostMax: 2400000, intakeMonths: ['August'], approvalBody: 'NMC-listed universities', fmgePassRate: 18, languageReq: 'English-medium + Russian basics', durationYears: 6 },
  { id: 'canada', name: 'Canada', slug: 'canada', programme: 'PG diploma', totalCostMin: 1800000, totalCostMax: 2200000, intakeMonths: ['January', 'September'], approvalBody: 'Designated Learning Institutions', fmgePassRate: null, languageReq: 'IELTS 6.0+', durationYears: 2 },
  { id: 'uk', name: 'UK', slug: 'uk', programme: 'MSc', totalCostMin: 2200000, totalCostMax: 2800000, intakeMonths: ['September', 'January'], approvalBody: 'UKVI-licensed sponsors', fmgePassRate: null, languageReq: 'IELTS 6.5+', durationYears: 1 },
  { id: 'kazakhstan', name: 'Kazakhstan', slug: 'kazakhstan', totalCostMin: 2000000, totalCostMax: 2800000, intakeMonths: ['September'], approvalBody: 'NMC-listed universities', fmgePassRate: 16, languageReq: 'English-medium', durationYears: 5 },
  { id: 'uzbekistan', name: 'Uzbekistan', slug: 'uzbekistan', totalCostMin: 1800000, totalCostMax: 2600000, intakeMonths: ['September'], approvalBody: 'NMC-listed universities', fmgePassRate: 14, languageReq: 'English-medium', durationYears: 6 },
  { id: 'philippines', name: 'Philippines', slug: 'philippines', totalCostMin: 2400000, totalCostMax: 3400000, intakeMonths: ['June', 'November'], approvalBody: 'NMC-listed universities', fmgePassRate: 28, languageReq: 'English-medium', durationYears: 6 }
];

