'use client';
/**
 * One read hook for the public site's smaller endpoints.
 *
 * lib/client/catalog.js already owns the listing data — it caches, it dedupes,
 * and it is shaped around one request per vertical. The surfaces added for the
 * client's content requirements read different things: one institution in full
 * (/api/[vertical]/institutions/[slug]), the boards record (/api/boards), the
 * reviews store (/api/reviews). Each is a single GET whose answer is small, and
 * each needs the same three states the catalogue hooks taught the UI to render.
 *
 * So this is deliberately thin: no cache, no retry policy, no shared promise.
 * Passing `url = null` skips the request entirely, which is how a component
 * that only sometimes has something to fetch stays a single unconditional hook.
 */
import { useCallback, useEffect, useState } from 'react';

const EMPTY = { data: null, state: 'loading', error: '' };

/**
 * @param {string|null} url endpoint, or null to fetch nothing
 * @returns {{data:Object|null,state:'idle'|'loading'|'ready'|'error',error:string,reload:()=>void}}
 */
export function useApi(url) {
  const [s, setS] = useState(url ? EMPTY : { ...EMPTY, state: 'idle' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) { setS({ ...EMPTY, state: 'idle' }); return; }
    let live = true;
    const ctrl = new AbortController();
    setS(prev => ({ ...prev, state: 'loading', error: '' }));
    fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } })
      .then(async res => {
        const body = await res.json().catch(() => null);
        // The envelope from lib/http.js carries its own message, and that
        // message is written for a reader. Prefer it over the status code.
        if (!res.ok || body?.ok === false) throw new Error(body?.message || `Request failed (${res.status})`);
        return body?.data ?? body;
      })
      .then(data => { if (live) setS({ data, state: 'ready', error: '' }); })
      .catch(err => {
        if (!live || err.name === 'AbortError') return;
        setS({ data: null, state: 'error', error: err.message });
      });
    return () => { live = false; ctrl.abort(); };
  }, [url, nonce]);

  const reload = useCallback(() => setNonce(n => n + 1), []);
  return { ...s, reload };
}
