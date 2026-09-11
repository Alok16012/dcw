/**
 * Plain language, derived from the record (client requirement 3).
 *
 * The brief is specific about who has to be able to read this site: a student
 * who has finished 10th or 12th, or who has failed a board exam, and who needs
 * to understand eligibility, validity, fees, duration, the admission process
 * and what to do next. The detail page already carried all six facts — spread
 * across a fee table, an approvals strip, a facts grid and a numbered process,
 * in the vocabulary of the people who publish them.
 *
 * These helpers answer the six questions in the words the question is asked in.
 * Everything is derived from the catalogue record, so a fee corrected in /admin
 * corrects the sentence too; nothing here is a stored second copy of a fact.
 * Where a listing carries an admin-written `plainSummary`, that wins — a
 * counsellor who has written a better sentence should not be overruled by a
 * template.
 *
 * No imports on purpose: this runs in the browser bundle beside the detail page.
 */

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');

const years = months => {
  if (!months) return null;
  if (months < 12) return `${months} months`;
  const y = months / 12;
  return `${Number.isInteger(y) ? y : y.toFixed(1)} year${y > 1 ? 's' : ''}`;
};

const onDate = iso => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** "UGC-DEB Entitled" reads as a filing reference. This reads as a sentence. */
function validitySentence(approvals = []) {
  const live = approvals.filter(a => a.body);
  if (!live.length) return 'We have not been able to put an approval document on file for this listing yet. Ask a counsellor before you pay anything.';
  const ugc = live.find(a => /UGC/i.test(a.body));
  const naac = live.find(a => /NAAC/i.test(a.body));
  const nmc = live.find(a => /NMC/i.test(a.body));
  const till = onDate(ugc?.validTill ?? nmc?.validTill ?? live[0].validTill);
  const parts = [];
  if (ugc) {
    parts.push('This university is entitled by UGC-DEB to teach this course at a distance, so the degree counts the same as a regular one for a government job or for further study.');
  } else if (nmc) {
    parts.push('This college is recognised by the National Medical Commission, which is the approval a medical degree has to have to be practised on in India.');
  } else {
    parts.push(`Recognised by ${live.map(a => a.body).join(', ')}.`);
  }
  if (naac?.grade) parts.push(`It also holds a NAAC ${naac.grade} grade, which is a quality rating, not a permission.`);
  if (till) parts.push(`The approval on file runs to ${till}; we check it again every admission cycle.`);
  return parts.join(' ');
}

/** How somebody actually gets in, in the order it happens to them. */
function processSteps(vertical, course) {
  if (vertical === 'colleges') {
    const exam = course?.examAccepted?.[0];
    return [
      exam ? `Appear for ${exam} and get your score.` : 'Complete the entrance exam this college admits on.',
      'Register for counselling and fill this college into your choice list.',
      'Attend document verification with your marksheets, ID and category certificate.',
      'Pay the first-year fee once a seat is allotted to you.'
    ];
  }
  return [
    'Talk to a counsellor — free, and nothing is charged to look.',
    'Send a photo of your 10th and 12th marksheet and your Aadhaar so eligibility can be checked.',
    'Fill the university form; we submit it and give you the reference number.',
    'Pay the first instalment directly to the university and keep the receipt.'
  ];
}

/**
 * The six questions, answered from the record.
 *
 * @param {Object} inst full institution record (repository shape)
 * @param {Object} [course] the course being looked at; defaults to the first
 * @returns {{q:string,a:string}[]}
 */
export function plainFacts(inst, course) {
  const c = course ?? inst?.courses?.find(x => x.isActive !== false) ?? inst?.courses?.[0] ?? null;
  const isCollege = inst?.vertical === 'colleges';
  const duration = years(c?.durationMonths);
  const emi = c?.emiMonthly ? `${money(c.emiMonthly)} a month` : null;
  const facts = [];

  facts.push({
    q: 'Can I apply?',
    a: c?.eligibility
      ? `${c.eligibility}. If you are still waiting for a result, or you failed a subject, say so — there is usually a route, and it costs nothing to ask.`
      : 'Ask a counsellor to check your marksheet against the university rule before you pay anything.'
  });

  facts.push({ q: 'Is the qualification valid?', a: validitySentence(inst?.approvals) });

  facts.push({
    q: 'What will it cost?',
    a: c?.totalFee
      ? `${money(c.totalFee)} in total for the whole course${c.mrpFee && c.mrpFee > c.totalFee ? `, down from ${money(c.mrpFee)} this intake` : ''}.${emi ? ` That can be paid as about ${emi}.` : ''} This is the fee the institution charges — DCW does not add anything on top.`
      : 'The fee for this listing is not on record yet. Ask a counsellor for the current figure in writing.'
  });

  facts.push({
    q: 'How long will it take?',
    a: duration
      ? `${duration}${c?.mode ? `, studied ${String(c.mode).toLowerCase().includes('online') ? 'online' : String(c.mode).toLowerCase()}` : ''}. ${isCollege ? 'That is the full course, including the internship where the course has one.' : 'You can keep working while you study — classes and exams are built around that.'}`
      : 'The course length is not on record yet. Ask a counsellor.'
  });

  facts.push({
    q: 'How do I get admission?',
    a: processSteps(inst?.vertical, c).map((s, i) => `${i + 1}. ${s}`).join(' ')
  });

  facts.push({
    q: 'What should I do now?',
    a: c?.deadline && c.deadline !== 'Rolling'
      ? `The current intake closes on ${c.deadline}. Ask for a callback before then — we will check whether you are eligible before you spend anything.`
      : 'Ask for a callback. A counsellor will check whether you are eligible before you spend anything.'
  });

  return facts;
}

/**
 * One sentence for a listing card: what it is, what it costs, how long.
 * An admin-written summary replaces it entirely.
 */
export function plainLine(card) {
  if (!card) return '';
  if (card.plainSummary) return card.plainSummary;
  const bits = [];
  if (card.course && card.course !== '—') bits.push(card.course);
  if (card.duration && card.duration !== '—') bits.push(card.duration);
  if (card.fee) bits.push(`${money(card.fee)} total`);
  return bits.join(' · ');
}
