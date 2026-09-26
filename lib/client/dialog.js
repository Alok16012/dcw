'use client';
import {useEffect,useRef} from 'react';

/* Every overlay in this file opened without moving focus: the dialog appeared,
   the activeElement stayed on the body behind it, Escape did nothing, and Tab
   walked the page underneath. This gives all three the same behaviour — take
   focus on open, keep it inside while trapping, hand it back on close, and
   close on Escape. `trap` is false for the nearby popover, which is a popover
   and not a modal: it should close on Escape but must not imprison the tab. */
/* The last element focused outside any dialog. A dialog's own autoFocus runs
   during React's commit, before the effect below, so reading
   document.activeElement there can hand back a control *inside* the dialog.
   Restoring to that focuses a node which is about to be removed, and the
   keyboard user is dropped at the top of the document instead of back on the
   control they opened the dialog from. */
let lastOutsideFocus = null, focusTracked = false;
function trackOutsideFocus(){
  if(focusTracked || typeof document === 'undefined') return;
  focusTracked = true;
  document.addEventListener('focusin', e => {
    const el = e.target;
    if(el instanceof Element && !el.closest('[role="dialog"]')) lastOutsideFocus = el;
  }, true);
}

// Registered at module load, not from inside the hook: the hook only runs once a
// dialog has already mounted, by which point the control that opened it has
// long since lost focus and there is nothing left to record.
trackOutsideFocus();

export function useDialogA11y(open, close, {trap = true} = {}){
  const ref = useRef(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if(!open) return;
    const node = ref.current;
    const active = document.activeElement;
    const restoreTo = (active && active !== document.body && !node?.contains(active))
      ? active : lastOutsideFocus;
    const SEL = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
    const items = () => [...(node?.querySelectorAll(SEL) ?? [])].filter(el => el.offsetParent !== null);
    // Focus the first real control rather than the container or the close
    // button: a screen reader then starts on the thing the dialog is for, and
    // typing works without a further Tab.
    const list = items();
    ((list.find(el => !el.classList.contains('modal-x')) ?? list[0]) ?? node)?.focus?.();
    const onKey = e => {
      if(e.key === 'Escape'){ e.stopPropagation(); closeRef.current?.(); return; }
      if(e.key !== 'Tab' || !trap || !node) return;
      const list = items();
      if(!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      else if(!node.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      // Only restore to something still in the document: focusing a detached
      // node silently sends focus to <body>, which is the bug this guards.
      if(restoreTo && document.contains(restoreTo)) restoreTo.focus?.();
    };
  }, [open, trap]);
  return ref;
}

