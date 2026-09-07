/**
 * DCW domain schema — mirrors the PRD §10 data model.
 *
 * Every record in lib/data is DEMO DATA. Fees, ratings, cutoffs, packages and
 * approval claims are indicative placeholders for layout and integration work.
 * They must be replaced with verified values before any public launch.
 *
 * @typedef {'distance'|'colleges'|'jobs'} Vertical
 */

export const VERTICALS = /** @type {const} */ (['distance', 'colleges', 'jobs']);

/** Marks every payload that leaves the demo drivers, so no caller mistakes it for verified data. */
export const DATA_PROVENANCE = 'demo';

/**
 * @typedef {Object} Institution
 * @property {string}   id
 * @property {Vertical} vertical          distance | colleges  (PRD: shared table)
 * @property {string}   slug              used in /:vertical/university/:slug
 * @property {string}   name
 * @property {string}   mark              2-letter fallback monogram
 * @property {string}   type              Government | Private | Deemed | State | Central
 * @property {string}   city
 * @property {string}   state
 * @property {string}   country
 * @property {number|null} established
 * @property {number}   rating
 * @property {number}   reviews
 * @property {number|null} nirfRank
 * @property {number}   featuredPriority  higher sorts first; 0 = not featured
 * @property {string}   description
 * @property {boolean}  isActive
 * @property {Approval[]} approvals
 * @property {InstitutionCourse[]} courses
 * @property {Cutoff[]} cutoffs
 * @property {Placement|null} placement
 */

/**
 * @typedef {Object} Approval
 * @property {string} body                UGC-DEB | AICTE | NAAC | NMC | INI
 * @property {string} grade
 * @property {string|null} validTill
 * @property {string|null} certificateUrl
 */

/**
 * @typedef {Object} InstitutionCourse
 * @property {string}  id
 * @property {string}  name
 * @property {string}  level              10th | 12th | UG | PG | Diploma
 * @property {string}  stream
 * @property {number}  durationMonths
 * @property {string}  mode               Online | Distance | Open school | Regular
 * @property {number}  totalFee
 * @property {number|null} mrpFee
 * @property {boolean} emiAvailable
 * @property {number|null} emiMonthly
 * @property {number|null} seats
 * @property {string}  eligibility
 * @property {string[]} examAccepted
 * @property {string}  deadline
 */

/**
 * @typedef {Object} Cutoff
 * @property {number} year
 * @property {string} category           Gen | OBC | SC | ST
 * @property {number} closingRank
 */

/**
 * @typedef {Object} Placement
 * @property {number} year
 * @property {number} highestPkg
 * @property {number} averagePkg
 * @property {number} medianPkg
 * @property {string[]} topRecruiters
 */

/**
 * @typedef {Object} Job
 * @property {string}  id
 * @property {string}  slug
 * @property {string}  title
 * @property {string}  companyId
 * @property {string}  location
 * @property {boolean} wfh
 * @property {number}  salaryMin        annual ₹
 * @property {number}  salaryMax
 * @property {string}  qualification    10th | 12th | Graduate | Any
 * @property {number}  experienceMin
 * @property {string}  jobType          Full-time | Part-time | Internship
 * @property {string}  industry
 * @property {number}  openings
 * @property {string}  jd
 * @property {string[]} responsibilities
 * @property {string}  expiresOn
 * @property {boolean} isActive
 * @property {boolean} featured
 * @property {string}  postedOn
 *
 * Optional fields below. They are what the public Berojgar Bharat listing needs
 * in order to be driven from this table instead of a second hardcoded copy:
 * coordinates power "jobs near me", `city` is the filter facet, and the display
 * strings exist because a filter enum ("12th") and a line a person reads
 * ("12th pass, freshers welcome") are not the same thing. All are optional, so
 * a job created through /admin without them still lists correctly.
 * @property {number|null}  [lat]           null for remote roles
 * @property {number|null}  [lng]
 * @property {string}   [city]              filter facet; "Remote" for wfh roles
 * @property {string}   [area]              locality shown after the city
 * @property {string}   [eligibility]       prose form of `qualification`
 * @property {string}   [roleType]          short function label, e.g. "Night shift"
 * @property {string[]} [tags]              curated badges; derived when absent
 * @property {string}   [deadlineLabel]     overrides the date for walk-ins/rolling
 */

/**
 * @typedef {Object} Company
 * @property {string}  id
 * @property {string}  name
 * @property {string}  mark             2-letter fallback monogram
 * @property {string}  about
 * @property {boolean} isVerified
 * @property {number}  [rating]         employer rating, demo data
 * @property {number}  [reviews]
 */

/**
 * @typedef {Object} Lead
 * @property {string}   id
 * @property {Vertical} vertical
 * @property {string}   name
 * @property {string}   phone
 * @property {boolean}  phoneVerified
 * @property {boolean}  whatsappSame
 * @property {string}   city
 * @property {string}   qualification
 * @property {string}   interestType
 * @property {string|null} interestId
 * @property {string|null} course            the programme chosen on an apply form, where one was
 * @property {string|null} associateCode
 * @property {string}   status
 * @property {string|null} crmLeadId
 * @property {Object}   source           { url, utm_*, device }
 * @property {string}   createdAt
 */
