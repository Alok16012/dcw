/**
 * Open-schooling boards, as one editable record instead of three hardcoded copies.
 *
 * Before this module the same three boards existed as: a seed table in
 * lib/data/reference.js (used by /api/boards/compare), a `BOARDS` array inside
 * components/tools/boards.jsx (used by the cards and the hero), and a literal
 * 7×4 grid written out by hand inside the comparison table in that same
 * component. Correcting NIOS's fee meant editing three places and shipping a
 * build, which is exactly the developer dependency the client asked to remove.
 *
 * One record now feeds all three, and /admin/boards edits it.
 *
 * The display strings are stored rather than derived because they are not
 * derivable: "45–60 days" is a range a board publishes, not a number, and
 * "2× yearly + on-demand" is a schedule. `resultDays` and `fee` stay alongside
 * them as the sortable/comparable values.
 *
 * PERSISTENCE: process memory, like every other repository here.
 */
import { boards as seedBoards } from './data/reference.js';

/** The comparison table's rows, in display order. `key` reads off the record. */
export const BOARD_FACTS = [
  { key: 'recognition', label: 'Recognition' },
  { key: 'examFrequency', label: 'Exam frequency' },
  { key: 'resultLabel', label: 'Typical result' },
  { key: 'acceptanceLabel', label: 'Acceptance score' },
  { key: 'flexibility', label: 'Subject flexibility' },
  { key: 'feeLabel', label: 'Indicative fee' },
  { key: 'bestFor', label: 'Best for' }
];

/** Everything the cards showed that the seed table did not carry. */
const DISPLAY = {
  nios: { full: 'National Institute of Open Schooling', kicker: 'CENTRAL BOARD', iconKey: 'badge',
    resultLabel: '45–60 days', feeLabel: '₹18,500', examLabel: '2×/yr + on-demand', flexibility: 'High',
    bestFor: 'Widest acceptance — college admission and government jobs.',
    plain: 'The safest choice. Almost every college and government job accepts it, and you can sit the exam twice a year or on demand.' },
  bosse: { full: 'Board of Open Schooling and Skill Education, Sikkim', kicker: 'STATE BOARD', iconKey: 'zap',
    resultLabel: '45 days', feeLabel: '₹17,000', examLabel: 'On-demand', flexibility: 'High',
    bestFor: 'Fastest legitimate route when a deadline is close.',
    plain: 'The quickest. Book the exam when you are ready and the result comes in about 45 days — useful if an admission deadline is close.' },
  bbose: { full: 'Bihar Board of Open Schooling and Examination', kicker: 'STATE BOARD', iconKey: 'rupee',
    resultLabel: '60–90 days', feeLabel: '₹9,500', examLabel: 'On-demand', flexibility: 'Medium',
    bestFor: 'Lowest fee for Bihar learners who can follow a schedule.',
    plain: 'The cheapest. Best if you live in Bihar, are not in a hurry, and want to keep the cost down.' }
};

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const slugify = s => String(s).toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40);

function fromSeed(b, i) {
  const d = DISPLAY[b.id] ?? {};
  return {
    id: b.id, name: b.name, full: d.full ?? b.name,
    kicker: d.kicker ?? 'OPEN SCHOOL', iconKey: d.iconKey ?? 'badge',
    recognition: b.recognition,
    examFrequency: b.examFrequency, examLabel: d.examLabel ?? b.examFrequency,
    resultDays: b.resultDays, resultLabel: d.resultLabel ?? `${b.resultDays} days`,
    fee: b.fee, feeLabel: d.feeLabel ?? money(b.fee),
    acceptance: b.acceptance, acceptanceLabel: `${b.acceptance} / 100`,
    speed: b.speed, flexibility: d.flexibility ?? 'High',
    tcRequired: b.tcRequired,
    bestFor: d.bestFor ?? b.bestFor,
    /* The one-line answer for someone who failed a board exam and does not know
       what any of the other fields mean. Requirement 3: the page has to be
       readable by the student it is written for. */
    plain: d.plain ?? b.bestFor,
    order: i, isActive: true, updatedAt: null, updatedBy: null
  };
}

let boards = seedBoards.map(fromSeed);

export const listBoards = ({ includeInactive = false } = {}) =>
  boards.filter(b => includeInactive || b.isActive).sort((a, b) => a.order - b.order);

export const findBoard = id => boards.find(b => b.id === id) ?? null;

/** The rows /distance/boards draws its comparison table from. */
export const boardComparison = () => {
  const rows = listBoards();
  return BOARD_FACTS.map(f => ({
    field: f.key, label: f.label,
    values: rows.map(b => String(b[f.key] ?? '—')),
    differs: new Set(rows.map(b => String(b[f.key] ?? '—'))).size > 1
  }));
};

export function validateBoard(input, { partial = false } = {}) {
  const e = {};
  const has = k => input[k] !== undefined && input[k] !== null && input[k] !== '';
  const need = k => (partial ? has(k) : true);

  if (need('name') && !String(input.name ?? '').trim()) e.name = 'Board name is required.';
  if (need('recognition') && !String(input.recognition ?? '').trim()) {
    e.recognition = 'Say what recognises this board — a student is choosing on exactly this.';
  }
  if (has('fee') && (!Number.isFinite(Number(input.fee)) || Number(input.fee) < 0)) e.fee = 'Enter the indicative fee in rupees.';
  if (has('resultDays') && (!Number.isInteger(Number(input.resultDays)) || Number(input.resultDays) < 1)) {
    e.resultDays = 'Result time must be a whole number of days.';
  }
  if (has('acceptance') && (Number(input.acceptance) < 0 || Number(input.acceptance) > 100)) {
    e.acceptance = 'Acceptance runs from 0 to 100.';
  }
  return e;
}

const TEXT = ['name', 'full', 'kicker', 'iconKey', 'recognition', 'examFrequency', 'examLabel',
  'resultLabel', 'feeLabel', 'acceptanceLabel', 'flexibility', 'bestFor', 'plain'];
const NUM = ['fee', 'resultDays', 'acceptance', 'speed', 'order'];

export function createBoard(input, { actor = 'admin' } = {}) {
  const errors = validateBoard(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const name = String(input.name).trim();
  let id = slugify(input.id || name);
  let n = 2;
  while (boards.some(b => b.id === id)) id = `${slugify(name)}-${n++}`;

  const fee = Number(input.fee ?? 0);
  const acceptance = Number(input.acceptance ?? 50);
  const resultDays = Number(input.resultDays ?? 60);
  const board = {
    id, name, full: String(input.full ?? name).trim(),
    kicker: String(input.kicker ?? 'OPEN SCHOOL').trim().toUpperCase(),
    iconKey: input.iconKey ?? 'badge',
    recognition: String(input.recognition).trim(),
    examFrequency: String(input.examFrequency ?? 'On-demand').trim(),
    examLabel: String(input.examLabel ?? input.examFrequency ?? 'On-demand').trim(),
    resultDays, resultLabel: String(input.resultLabel ?? `${resultDays} days`).trim(),
    fee, feeLabel: String(input.feeLabel ?? money(fee)).trim(),
    acceptance, acceptanceLabel: String(input.acceptanceLabel ?? `${acceptance} / 100`).trim(),
    speed: Number(input.speed ?? 60),
    flexibility: String(input.flexibility ?? 'High').trim(),
    tcRequired: input.tcRequired === true,
    bestFor: String(input.bestFor ?? '').trim(),
    plain: String(input.plain ?? input.bestFor ?? '').trim(),
    order: Number(input.order ?? boards.length),
    isActive: input.isActive !== false,
    updatedAt: new Date().toISOString(), updatedBy: actor
  };
  boards.push(board);
  return { ok: true, board };
}

export function updateBoard(id, patch, { actor = 'admin' } = {}) {
  const board = findBoard(id);
  if (!board) return { ok: false, error: 'NOT_FOUND' };
  const errors = validateBoard(patch, { partial: true });
  if (Object.keys(errors).length) return { ok: false, errors };

  for (const k of TEXT) if (patch[k] !== undefined) board[k] = String(patch[k]).trim();
  for (const k of NUM) if (patch[k] !== undefined && patch[k] !== '') board[k] = Number(patch[k]);
  if (patch.tcRequired !== undefined) board.tcRequired = !!patch.tcRequired;
  if (patch.isActive !== undefined) board.isActive = !!patch.isActive;

  // The display strings follow the numbers unless the same edit set them by
  // hand, so a corrected fee cannot leave last season's figure on the card.
  if (patch.fee !== undefined && patch.feeLabel === undefined) board.feeLabel = money(board.fee);
  if (patch.acceptance !== undefined && patch.acceptanceLabel === undefined) board.acceptanceLabel = `${board.acceptance} / 100`;
  if (patch.resultDays !== undefined && patch.resultLabel === undefined) board.resultLabel = `${board.resultDays} days`;

  board.updatedAt = new Date().toISOString();
  board.updatedBy = actor;
  return { ok: true, board };
}

/** Soft by default: a board a student applied through has to stay resolvable. */
export function deleteBoard(id, { hard = false } = {}) {
  const i = boards.findIndex(b => b.id === id);
  if (i === -1) return { ok: false, error: 'NOT_FOUND' };
  if (hard) { const [b] = boards.splice(i, 1); return { ok: true, board: b, hard: true }; }
  boards[i].isActive = false;
  boards[i].updatedAt = new Date().toISOString();
  return { ok: true, board: boards[i], hard: false };
}

export const __resetBoards = () => { boards = seedBoards.map(fromSeed); };
