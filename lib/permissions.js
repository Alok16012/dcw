/**
 * The capability table, in a module with no Node dependencies.
 *
 * It lives apart from lib/auth.js so the console can import `can()` in a client
 * component without dragging `node:crypto` into the browser bundle. lib/auth.js
 * re-exports everything here, so there is still one table and one reader.
 *
 * WHAT THE CONSOLE USES IT FOR, AND WHAT IT DOES NOT.
 *   Hiding a nav item somebody cannot use is a courtesy — it stops them clicking
 *   into a 403. It is NOT the control. Every route calls requirePermission()
 *   server-side against this same table, so a fetch typed into a console meets
 *   the identical check the button does.
 */

export const ROLES = ['student', 'associate', 'staff', 'employer', 'admin'];

/** The two lead pipelines. Education = DCW + Colleges Wala. Berojgar = BB. */
export const CRM_EDUCATION = 'education';
export const CRM_BEROJGAR = 'berojgar';

/**
 * Capability grants. `*` is admin's wildcard; every other role lists what it may
 * do explicitly, so adding a role cannot accidentally inherit a power nobody
 * meant to give it.
 *
 * `:own` suffixes are a promise the *route* keeps — the capability says an
 * employer may read applications, the route scopes them to their company.
 */
export const PERMISSIONS = {
  admin: ['*'],
  staff: [
    'catalogue:read', 'catalogue:write',
    'boards:read', 'boards:write',
    'proof:read', 'proof:write',
    'jobs:read', 'jobs:write',
    'applications:read', 'applications:write',
    'leads:read', 'leads:write',
    'whatsapp:read', 'whatsapp:send'
  ],
  employer: ['jobs:read:own', 'jobs:write:own', 'applications:read:own', 'applications:write:own'],
  associate: ['catalogue:read', 'leads:read:own', 'applications:read:own'],
  student: ['self:read']
};

export const ROLE_LABELS = {
  student: 'Student', associate: 'Associate', staff: 'Staff',
  employer: 'Employer', admin: 'Admin'
};

/**
 * Does this session hold `capability`?
 *
 * A grant of `leads:read` implies `leads:read:own` — someone allowed to see
 * every lead is obviously allowed to see their own — but never the reverse.
 */
export function can(session, capability) {
  if (!session) return false;
  const grants = PERMISSIONS[session.role] ?? [];
  if (grants.includes('*') || grants.includes(capability)) return true;
  if (capability.endsWith(':own') && grants.includes(capability.slice(0, -4))) return true;
  return false;
}
