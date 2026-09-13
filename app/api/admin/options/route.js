/**
 * The editable dropdown vocabularies.
 *
 * One route for all of them rather than seven near-identical ones: the sets
 * differ only in which strings they hold, and `key` already names the set. The
 * guard is `catalogue:write` — the same capability that lets someone change a
 * course — because these lists ARE catalogue shape: adding a level or renaming
 * a stream changes what every listing can say about itself.
 *
 * As everywhere else in the console, hiding the settings link from a role that
 * lacks the capability is a courtesy; this check is the control, and a fetch
 * typed into a browser console meets exactly the same one.
 */
import { listOptionSets, optionSetMeta, addOption, renameOption, removeOption,
  reorderOptions, isOptionSet } from '@/lib/option-lists.js';
import { usageMap, countUsage, applyRename } from '@/lib/option-usage.js';
import { requirePermission } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

/** Sets plus their usage counts, which is what the screen needs to warn before
 *  a delete. Counting is a walk over the catalogue, so it happens once per
 *  request here rather than once per value in the client. */
const withUsage = () => listOptionSets().map(s => ({
  ...s, usage: s.field ? usageMap(s.field, s.values) : {}
}));

export async function GET(request) {
  const { error } = requirePermission(request, 'catalogue:read');
  if (error) return error;
  ensureSeeded();
  return ok({ sets: withUsage() });
}

export async function POST(request) {
  const { error } = requirePermission(request, 'catalogue:write');
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  if (!isOptionSet(body.key)) return fail(404, 'NO_SET', `No dropdown called "${body.key}".`);
  ensureSeeded();

  const result = addOption(body.key, body.value);
  if (!result.ok) return fail(422, result.error, result.message ?? 'That option could not be added.');
  return ok({ set: { ...optionSetMeta(body.key), values: result.values }, sets: withUsage(),
    duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
}

/**
 * Rename, or reorder. Both are PATCH because both edit the set in place; which
 * one is meant is decided by whether `order` is present, not by a mode flag.
 */
export async function PATCH(request) {
  const { error } = requirePermission(request, 'catalogue:write');
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  if (!isOptionSet(body.key)) return fail(404, 'NO_SET', `No dropdown called "${body.key}".`);
  ensureSeeded();

  if (Array.isArray(body.order)) {
    const result = reorderOptions(body.key, body.order);
    if (!result.ok) return fail(422, result.error, 'That order could not be applied.');
    return ok({ set: { ...optionSetMeta(body.key), values: result.values }, sets: withUsage() });
  }

  const result = renameOption(body.key, body.from, body.to);
  if (!result.ok) {
    return result.error === 'NOT_FOUND'
      ? fail(404, 'NOT_FOUND', `“${body.from}” is not in that list.`)
      : fail(422, result.error, result.message ?? 'That option could not be renamed.');
  }
  // The records holding the old string move with it. See lib/option-usage.js
  // for why a rename cascades and a delete does not.
  const field = optionSetMeta(body.key).field;
  const moved = field ? applyRename(field, result.previous, result.value) : 0;
  return ok({ set: { ...optionSetMeta(body.key), values: result.values }, sets: withUsage(),
    renamed: { from: result.previous, to: result.value }, recordsUpdated: moved });
}

/**
 * Removes a value. Refused with a 409 and the count when records still hold it,
 * so the person deleting sees what they are about to orphan; `?force=true` is
 * the second click that follows.
 */
export async function DELETE(request) {
  const { error } = requirePermission(request, 'catalogue:write');
  if (error) return error;
  const sp = request.nextUrl.searchParams;
  const key = sp.get('key');
  const value = sp.get('value');
  if (!isOptionSet(key)) return fail(404, 'NO_SET', `No dropdown called "${key}".`);
  ensureSeeded();

  const meta = optionSetMeta(key);
  const force = sp.get('force') === 'true';
  const usage = meta.field ? countUsage(meta.field, value) : { total: 0, by: [] };
  if (usage.total > 0 && !force) {
    const detail = usage.by.map(x => `${x.count} ${x.label}${x.count === 1 ? '' : 's'}`).join(', ');
    return fail(409, 'IN_USE',
      `${detail} still use “${value}”. They keep the value if you remove it — it just stops being offered.`,
      { usage });
  }

  const result = removeOption(key, value, { force });
  if (!result.ok) {
    return result.error === 'NOT_FOUND'
      ? fail(404, 'NOT_FOUND', `“${value}” is not in that list.`)
      : fail(409, result.error, result.message ?? 'That option could not be removed.');
  }
  return ok({ set: { ...meta, values: result.values }, sets: withUsage(), usage });
}
