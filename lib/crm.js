/**
 * The CRM is a separate app (github.com/Alok16012/dcwcrm) served on this
 * domain under /crm — next.config.mjs proxies /crm/* to its deployment. It
 * has its own Supabase accounts; this site never sees those credentials.
 *
 * · /crm/login          one screen, two workspaces. DCW staff and associates
 *                       pick "Distance Courses Wala"; Berojgar Bharat staff
 *                       (bb_admin, bb_manager, bb_telecaller) pick "Berojgar
 *                       Bharat". An account on the wrong workspace is signed out.
 * · /crm/student/login  students sign in with their enrollment number.
 */
export const CRM = {
  // ?brand= opens the CRM login straight on the right workspace.
  staff: '/crm/login?brand=dcw',
  associate: '/crm/login?brand=dcw',
  student: '/crm/student/login',
  bb: '/crm/login?brand=bb'
};

/** The three websites whose content the /admin console manages separately. */
export const SITES = {
  distance: { label: 'Distance Courses Wala', short: 'Distance', logo: '/distance-lockup.png' },
  colleges: { label: 'Colleges Wala', short: 'Colleges', logo: '/colleges-lockup.png' },
  jobs: { label: 'Berojgar Bharat', short: 'Jobs', logo: '/jobs-lockup.png' }
};
