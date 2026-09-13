'use client';
import { useEffect, useState, useCallback } from 'react';
import { PageTop, useToast } from '../AdminShell.jsx';
import { api, ApiError } from '@/lib/admin-client.js';
import { IconAlert, IconPlus, IconTrash, IconEdit, IconCheck, IconClose, IconSliders } from '../icons.jsx';

/**
 * Every dropdown in the console, editable.
 *
 * The lists behind the console's selects used to be literal arrays inside the
 * JSX that rendered them — the five course levels appeared verbatim in three
 * separate files — so adding one meant a code change and a deploy. In practice
 * that meant they never changed, and staff typed the value they wanted into
 * whatever free-text field was nearest. This screen is the single place they
 * live; the repositories validate against the same list.
 *
 * What is NOT here, and why, is stated on the page rather than left as a gap:
 * admission and application stages are a state machine, not vocabulary.
 */
export default function SettingsPage() {
  const toast = useToast();
  const [sets, setSets] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  /* Per-set UI state, keyed by set key: what is being typed into its add box,
     and which of its values is open for rename. */
  const [adding, setAdding] = useState({});
  const [editing, setEditing] = useState(null);   // { key, from, to }

  const load = useCallback(async () => {
    try { setSets((await api('/admin/options')).sets); setErr(null); }
    catch (e) {
      setErr(e.status === 403
        ? 'Editing these lists needs catalogue permissions.'
        : e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handle(e, fallback) {
    if (e instanceof ApiError) toast(e.message || fallback, 'bad');
    else toast(fallback, 'bad');
  }

  async function add(key) {
    const value = (adding[key] ?? '').trim();
    if (!value) return;
    setBusy(true);
    try {
      const d = await api('/admin/options', { method: 'POST', body: { key, value } });
      setSets(d.sets);
      setAdding(p => ({ ...p, [key]: '' }));
      toast(d.duplicate ? `“${value}” was already in that list.` : `“${value}” added.`);
    } catch (e) { handle(e, 'That option could not be added.'); }
    setBusy(false);
  }

  async function rename() {
    const { key, from, to } = editing;
    if (!to.trim() || to.trim() === from) { setEditing(null); return; }
    setBusy(true);
    try {
      const d = await api('/admin/options', { method: 'PATCH', body: { key, from, to: to.trim() } });
      setSets(d.sets);
      setEditing(null);
      // A rename carries through to the records holding the old string, which
      // is the whole reason it is a rename and not a delete-then-add.
      toast(d.recordsUpdated
        ? `Renamed — ${d.recordsUpdated} record${d.recordsUpdated === 1 ? '' : 's'} updated.`
        : 'Renamed.');
    } catch (e) { handle(e, 'That option could not be renamed.'); }
    setBusy(false);
  }

  /** Deletes, asking once where records still hold the value. The records keep
   *  it either way — see lib/option-lists.js — so the confirm says so. */
  async function remove(key, value, force = false) {
    setBusy(true);
    try {
      const d = await api(`/admin/options?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}${force ? '&force=true' : ''}`,
        { method: 'DELETE' });
      setSets(d.sets);
      toast(`“${value}” removed from the list.`);
    } catch (e) {
      if (e.status === 409 && e.code === 'IN_USE') {
        if (confirm(`${e.message}\n\nRemove it from the dropdown anyway?`)) { setBusy(false); return remove(key, value, true); }
      } else handle(e, 'That option could not be removed.');
    }
    setBusy(false);
  }

  async function move(key, value, delta) {
    const set = sets.find(s => s.key === key);
    const i = set.values.indexOf(value);
    const j = i + delta;
    if (i === -1 || j < 0 || j >= set.values.length) return;
    const order = set.values.slice();
    order.splice(j, 0, ...order.splice(i, 1));
    setBusy(true);
    try { setSets((await api('/admin/options', { method: 'PATCH', body: { key, order } })).sets); }
    catch (e) { handle(e, 'That order could not be applied.'); }
    setBusy(false);
  }

  return (
    <>
      <PageTop title="Dropdowns & lists"
        sub="The options behind every select in the console. Add, rename, reorder or remove — no deploy." />

      <div className="adm-body">
        {err && <div className="adm-note bad"><IconAlert />{err}</div>}

        <div className="adm-note">
          <IconSliders />
          Renaming an option carries the new wording through to every record holding the old one.
          Removing one only stops it being offered — records keep the value they already have, and
          you are told how many before anything happens.
        </div>

        {!sets && !err && (
          <div className="adm-panel" style={{ padding: 18 }}>
            {[0, 1, 2].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}
          </div>
        )}

        {sets && (
          <div className="adm-optsets">
            {sets.map(set => (
              <section key={set.key} className="adm-panel" style={{ padding: 18 }}>
                <h2 style={{ fontSize: 15, margin: '0 0 2px' }}>{set.label}</h2>
                {set.hint && <p className="adm-more-note">{set.hint}</p>}

                <div className="adm-minilist">
                  {set.values.map((v, i) => {
                    const used = set.usage?.[v] ?? 0;
                    const locked = (set.locked ?? []).some(l => l.toLowerCase() === v.toLowerCase());
                    const open = editing && editing.key === set.key && editing.from === v;
                    return (
                      <div key={v} className="adm-minirow">
                        {open ? (
                          <>
                            <input className="adm-optinput" value={editing.to} autoFocus
                              onChange={e => setEditing(p => ({ ...p, to: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') rename(); if (e.key === 'Escape') setEditing(null); }}
                              aria-label={`New name for ${v}`} />
                            <button className="adm-btn sm pri" onClick={rename} disabled={busy}><IconCheck />Save</button>
                            <button className="adm-btn sm ghost" onClick={() => setEditing(null)} disabled={busy}
                              aria-label="Cancel rename"><IconClose /></button>
                          </>
                        ) : (
                          <>
                            <div>
                              <b>{v}</b>
                              <small>
                                {used ? `used by ${used} record${used === 1 ? '' : 's'}` : 'not used yet'}
                                {locked && ' · the site’s own logic depends on this one'}
                              </small>
                            </div>
                            <span className="adm-optmove">
                              <button className="adm-btn sm ghost" disabled={busy || i === 0}
                                onClick={() => move(set.key, v, -1)} aria-label={`Move ${v} up`}>↑</button>
                              <button className="adm-btn sm ghost" disabled={busy || i === set.values.length - 1}
                                onClick={() => move(set.key, v, 1)} aria-label={`Move ${v} down`}>↓</button>
                            </span>
                            <button className="adm-btn sm" disabled={busy}
                              onClick={() => setEditing({ key: set.key, from: v, to: v })}
                              aria-label={`Rename ${v}`}><IconEdit /></button>
                            <button className="adm-btn sm ghost" disabled={busy || locked}
                              onClick={() => remove(set.key, v)}
                              title={locked ? 'Locked — rename it instead.' : `Remove ${v}`}
                              aria-label={`Remove ${v}`}><IconTrash /></button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="adm-optadd">
                  <input value={adding[set.key] ?? ''} placeholder={`Add to ${set.label.toLowerCase()}…`}
                    aria-label={`Add an option to ${set.label}`}
                    onChange={e => setAdding(p => ({ ...p, [set.key]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') add(set.key); }} />
                  <button className="adm-btn" onClick={() => add(set.key)}
                    disabled={busy || !(adding[set.key] ?? '').trim()}><IconPlus />Add</button>
                </div>
              </section>
            ))}
          </div>
        )}

        {sets && (
          <div className="adm-note warn" style={{ marginTop: 18 }}>
            <IconAlert />
            Application and admission stages are not on this page on purpose. They are a state
            machine, not a vocabulary — which stage may follow which is written into the code that
            moves a file, and the fee triggers hang off those names. Renaming “Verified” here would
            break both silently, so stage names stay with the logic that reads them.
          </div>
        )}
      </div>
    </>
  );
}
