'use client';
/**
 * The public site's one door to catalogue data.
 *
 * Before this module the browser bundle carried its own hardcoded copies of the
 * universities, colleges and jobs — so /admin could create a job that never
 * appeared publicly, and the two datasets drifted with every edit. Everything
 * now comes through the HTTP API, which reads lib/store.js, which reads
 * lib/data + lib/jobs-repo. One source of truth, one place to swap when the
 * demo data becomes a real database.
 *
 * The shape returned is the flat card projection from lib/store.js; see
 * institutionCard/jobCard there for the field list.
 */
import { useCallback, useEffect, useState } from 'react';

/** Everything the listing needs in one request. The catalogue is small enough
 *  that paging it client-side beats a request per filter change. */
const PAGE_SIZE = 50;

function endpoint(vertical) {
  return vertical === 'jobs'
    ? `/api/jobs?pageSize=${PAGE_SIZE}`
    : `/api/${vertical}/institutions?pageSize=${PAGE_SIZE}`;
}

/**
 * @param {'distance'|'colleges'|'jobs'} vertical
 * @param {AbortSignal} [signal]
 * @returns {Promise<{rows:Object[],total:number}>}
 */
export async function fetchCatalog(vertical, signal) {
  const res = await fetch(endpoint(vertical), { signal, headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Catalogue unavailable (${res.status})`);
  const body = await res.json().catch(() => null);
  if (!body || body.ok === false) throw new Error(body?.message || 'Catalogue unavailable');
  const data = body.data ?? body;
  return { rows: data.rows ?? [], total: data.total ?? (data.rows?.length ?? 0) };
}

/* ── Cache ───────────────────────────────────────────────────────────────────
   The site is one client-side route tree, so every navigation unmounts and
   remounts the surfaces below. Without a cache each remount re-ran the effect
   and re-fetched all fifty rows: a walk of /, /distance, /colleges and /jobs
   in the browser log issued the same three catalogue requests once per hop,
   and any page holding useAllCatalogs issued three at a time on its own.

   The entry stores the in-flight promise, not the resolved rows, so several
   components mounting in the same tick share one request instead of racing
   three identical ones. `at` is the moment the request was made and is handed
   back as `fetchedAt`, so a surface that reports freshness keeps telling the
   truth from cache — it reports when the data was read, not when it was
   displayed. A rejection is evicted immediately so a failure is never cached.

   Sixty seconds is chosen against the write path, not by feel: the catalogue
   changes only when someone saves in /admin, and `reload()` — the retry the
   error state already offers — drops the entry, so a stale read is never
   something the reader is stuck with. */
const TTL_MS = 60_000;
/** @type {Map<string,{at:number,promise:Promise<{rows:Object[],total:number}>}>} */
const cache = new Map();

function cachedCatalog(vertical) {
  const hit = cache.get(vertical);
  if (hit && Date.now() - hit.at < TTL_MS) return hit;
  // No signal: the promise is shared, so one consumer unmounting must not
  // abort a request the others are still waiting on. Late results are ignored
  // by the `live` flag in the hooks below instead.
  const entry = { at: Date.now(), promise: fetchCatalog(vertical) };
  entry.promise.catch(() => { if (cache.get(vertical) === entry) cache.delete(vertical); });
  cache.set(vertical, entry);
  return entry;
}

/** Drop cached rows so the next read goes to the network. This is what backs
 *  `reload()` — the retry the error state offers — and it is exported so that
 *  a caller which has just written to the catalogue can invalidate it. Nothing
 *  outside this module calls it yet: /admin is a separate route tree, so
 *  navigating there is a document load and takes the whole cache with it. */
export function invalidateCatalog(vertical) {
  if (vertical) cache.delete(vertical); else cache.clear();
}

/**
 * Catalogue for a vertical, with the three states every caller has to render:
 * loading (no rows yet), error (a retry is offered) and ready.
 *
 * @param {'distance'|'colleges'|'jobs'} vertical
 * `fetchedAt` is the moment the rows on screen were read, so a surface that
 * tells the reader how fresh they are can say something true.
 *
 * @returns {{rows:Object[],total:number,fetchedAt:number|null,state:'loading'|'ready'|'error',error:string,reload:()=>void}}
 */
export function useCatalog(vertical) {
  const [s, setS] = useState({ rows: [], total: 0, fetchedAt: null, state: 'loading', error: '' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    const entry = cachedCatalog(vertical);
    setS(prev => ({ ...prev, state: 'loading', error: '' }));
    entry.promise
      .then(({ rows, total }) => { if (live) setS({ rows, total, fetchedAt: entry.at, state: 'ready', error: '' }); })
      .catch(err => {
        if (!live) return;
        setS({ rows: [], total: 0, fetchedAt: null, state: 'error', error: err.message });
      });
    return () => { live = false; };
  }, [vertical, nonce]);

  const reload = useCallback(() => { invalidateCatalog(vertical); setNonce(n => n + 1); }, [vertical]);
  return { ...s, reload };
}

const ALL = ['distance', 'colleges', 'jobs'];

/**
 * Every vertical at once, for the surfaces that are not scoped to one — the
 * shortlist, for instance, holds a university, a college and a job side by
 * side. Same contract as useCatalog, so callers render identical states.
 *
 * @returns {{rows:Object[],total:number,state:'loading'|'ready'|'error',error:string,reload:()=>void}}
 */
export function useAllCatalogs() {
  const [s, setS] = useState({ rows: [], total: 0, fetchedAt: null, state: 'loading', error: '' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    const entries = ALL.map(cachedCatalog);
    setS(prev => ({ ...prev, state: 'loading', error: '' }));
    Promise.all(entries.map(e => e.promise))
      .then(parts => {
        if (!live) return;
        const rows = parts.flatMap(p => p.rows);
        // The oldest of the three reads is the honest freshness of the set.
        setS({ rows, total: rows.length, fetchedAt: Math.min(...entries.map(e => e.at)), state: 'ready', error: '' });
      })
      .catch(err => {
        if (!live) return;
        setS({ rows: [], total: 0, fetchedAt: null, state: 'error', error: err.message });
      });
    return () => { live = false; };
  }, [nonce]);

  const reload = useCallback(() => { invalidateCatalog(); setNonce(n => n + 1); }, []);
  return { ...s, reload };
}
