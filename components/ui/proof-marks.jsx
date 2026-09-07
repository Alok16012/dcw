/* ---------------------------------------------------------------------------
   Proof marks — the six figures in the hero strip.

   These were lucide's ShieldCheck, GraduationCap, MessageCircle, Briefcase,
   Clock3 and Building2: a stroke-only family drawn on a 24px grid at a uniform
   weight, which is exactly right for a toolbar and exactly wrong here. In the
   hero these three glyphs are the only illustration on the page, they sit at
   20px inside a medallion, and each one is the visual argument for the number
   printed beside it. A hairline outline gives that number nothing to lean on:
   at that size the three of them reduce to the same grey scribble, and a
   mortarboard is not a picture of "compared" anyway.

   So each mark here is drawn as a figure/ground pair rather than an outline:
   a solid silhouette carrying the shape, a lighter field behind it carrying
   the mass, and one struck detail — the check, the tallest column, the
   figure standing forward — that says which of the six it is. Read at 20px
   from a metre away, that is what survives.

   Rules the set holds to, so it stays a family:
     - 24x24 grid, optical weight matched across all six.
     - Colour comes from currentColor only. The tiles are on a photograph in
       one place and on a light card in another; a hard-coded fill would be
       wrong in one of them.
     - The lighter field is the same currentColor at .28 opacity, never a
       second hue — two hues at 20px is mud.
     - Strokes that remain are 1.7 with round joins, matching the weight of
       the solid forms rather than lucide's 2.
     - No mark relies on detail below ~1.4px at render size.
   --------------------------------------------------------------------------- */

const box = { viewBox: '0 0 24 24', width: 24, height: 24, fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
/* One shared value for the field so a change stays a change to the family. */
const FIELD = 0.28;

/* 100% approvals on file.
   A struck seal, not a shield: what the number attests is that someone checked
   a document at source, and a rosette with a check punched through it is the
   mark every Indian student already reads as "verified copy". The twelve lobes
   are drawn as one path so the edge stays crisp when it is scaled down. */
export function MarkVerified() {
  return (
    <svg {...box} aria-hidden="true">
      <path d="M12 1.5l2.35 1.72 2.87-.35.95 2.75 2.62 1.28-.62 2.85L22 12l-1.83 2.25.62 2.85-2.62 1.28-.95 2.75-2.87-.35L12 22.5l-2.35-1.72-2.87.35-.95-2.75-2.62-1.28.62-2.85L2 12l1.83-2.25-.62-2.85 2.62-1.28.95-2.75 2.87.35z"
        fill="currentColor" opacity={FIELD} />
      <circle cx="12" cy="12" r="6.6" fill="currentColor" />
      {/* The check is knocked out of the disc rather than drawn on top of it,
          so it stays legible when the disc darkens against a bright photo. */}
      <path d="M8.9 12.15l2.15 2.15 4.05-4.5" stroke="var(--mark-knockout,#0B1526)"
        strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* N universities compared.
   Not a mortarboard. The claim is that the fees, EMI and mode of several
   institutions sit side by side on one record, so the mark is that record:
   a sheet with three columns of unequal height on a shared baseline. Unequal
   is the whole point — three equal columns would say "list", not "compare". */
export function MarkCompared() {
  return (
    <svg {...box} aria-hidden="true">
      <rect x="2.3" y="3.4" width="19.4" height="17.2" rx="3.2" fill="currentColor" opacity={FIELD} />
      <rect x="5.4" y="12.9" width="3.5" height="5.3" rx="1.2" fill="currentColor" opacity=".6" />
      <rect x="10.25" y="9.1" width="3.5" height="9.1" rx="1.2" fill="currentColor" />
      <rect x="15.1" y="11.4" width="3.5" height="6.8" rx="1.2" fill="currentColor" opacity=".6" />
      {/* The marker sits on the tallest column, not in a header: a comparison
          with nothing chosen at the end of it is just a chart. */}
      <circle cx="12" cy="6.1" r="1.5" fill="currentColor" />
    </svg>
  );
}

/* 1:1 counsellor for life.
   Two people, because the figure printed beside this mark is literally "1:1".
   The first draft was one head plus a speech panel with two dots in it; at
   34px those dots fell to about a pixel and a half and the panel collapsed
   into a smudge on the shoulder. Here the ratio is the drawing: the student
   held back in the field weight, the counsellor solid and a step forward, the
   two silhouettes overlapping at the shoulder so they read as a pair rather
   than as a crowd. Nothing in it is smaller than a head. */
export function MarkCounsellor() {
  return (
    <svg {...box} aria-hidden="true">
      {/* Drawn first so the solid figure cuts its own edge out of this one —
          no knockout stroke needed to keep the two apart. */}
      <g fill="currentColor" opacity={FIELD}>
        <circle cx="16.6" cy="8.4" r="3.3" />
        <path d="M11.2 21.5a5.4 5.4 0 0 1 10.8 0z" />
      </g>
      <g fill="currentColor">
        <circle cx="8.6" cy="9.4" r="3.9" />
        <path d="M2.1 21.5a6.5 6.5 0 0 1 13 0z" />
      </g>
    </svg>
  );
}

/* N openings live.
   A briefcase reduced to what distinguishes it at 20px — the handle and the
   clasp band — with the count implied by the stack behind it. The second
   outline is offset, not concentric: postings arrive one on top of another. */
export function MarkOpenings() {
  return (
    <svg {...box} aria-hidden="true">
      <path d="M9 5.4V4.6A1.9 1.9 0 0 1 10.9 2.7h2.2A1.9 1.9 0 0 1 15 4.6v.8"
        stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <rect x="2.4" y="5.4" width="19.2" height="15" rx="3" fill="currentColor" opacity={FIELD} />
      <path d="M2.4 11.3c3.1 1.5 6.3 2.3 9.6 2.3s6.5-.8 9.6-2.3"
        stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <rect x="10.1" y="11.6" width="3.8" height="3.5" rx="1.3" fill="currentColor" />
    </svg>
  );
}

/* N posted this week.
   The first draft was a dial, and a dial says "time", not "recently" — at 20px
   its open ring read as a crescent. A calendar with the latest days struck out
   of the row states the sentence the number is making: these arrived in the
   days just gone. */
export function MarkThisWeek() {
  return (
    <svg {...box} aria-hidden="true">
      <rect x="6.9" y="1.7" width="2.3" height="4.4" rx="1.15" fill="currentColor" />
      <rect x="14.8" y="1.7" width="2.3" height="4.4" rx="1.15" fill="currentColor" />
      <rect x="2.4" y="3.7" width="19.2" height="17.3" rx="3.1" fill="currentColor" opacity={FIELD} />
      {/* Squared at the foot so it reads as a bound header rather than a pill. */}
      <path d="M2.4 6.8a3.1 3.1 0 0 1 3.1-3.1h13a3.1 3.1 0 0 1 3.1 3.1v1.9H2.4z" fill="currentColor" />
      <g fill="currentColor">
        <rect x="4.9" y="11.4" width="3.3" height="3.3" rx="1" opacity=".42" />
        <rect x="9.35" y="11.4" width="3.3" height="3.3" rx="1" opacity=".42" />
        <rect x="13.8" y="11.4" width="3.3" height="3.3" rx="1" opacity=".72" />
        <rect x="18.25" y="11.4" width="3.3" height="3.3" rx="1" />
      </g>
    </svg>
  );
}

/* N hiring employers.
   Two premises of different height rather than one tower: the figure counts
   employers, and a single building counts one. The windows are cut out of the
   silhouettes rather than drawn on them — a stroked grid at this size turns
   into a smudge, while a knock-out keeps its edges however far it is reduced.
   The shorter block is held back so the pair reads as depth, not as a bar
   chart with two columns. */
export function MarkEmployers() {
  return (
    <svg {...box} aria-hidden="true">
      <rect x="2.3" y="8.5" width="8.6" height="12.8" rx="2.1" fill="currentColor" opacity=".52" />
      <g fill="var(--mark-knockout,#0B1526)">
        <rect x="4.5" y="11.4" width="2.2" height="2.2" rx=".7" />
        <rect x="7.4" y="11.4" width="2.2" height="2.2" rx=".7" />
        <rect x="4.5" y="15.3" width="2.2" height="2.2" rx=".7" />
        <rect x="7.4" y="15.3" width="2.2" height="2.2" rx=".7" />
      </g>
      <rect x="12.1" y="2.7" width="9.6" height="18.6" rx="2.4" fill="currentColor" />
      <g fill="var(--mark-knockout,#0B1526)">
        <rect x="14.3" y="5.9" width="2.3" height="2.3" rx=".75" />
        <rect x="17.4" y="5.9" width="2.3" height="2.3" rx=".75" />
        <rect x="14.3" y="10" width="2.3" height="2.3" rx=".75" />
        <rect x="17.4" y="10" width="2.3" height="2.3" rx=".75" />
        <rect x="15.35" y="14.9" width="3.2" height="6.4" rx="1.3" />
      </g>
    </svg>
  );
}
