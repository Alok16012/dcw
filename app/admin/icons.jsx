/** One coherent icon family for the console: 20px grid, 1.7 stroke, round caps. */
const S = ({ children, ...p }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>{children}</svg>
);
export const IconGrid = p => <S {...p}><rect x="2.5" y="2.5" width="6" height="6" rx="1.5"/><rect x="11.5" y="2.5" width="6" height="6" rx="1.5"/><rect x="2.5" y="11.5" width="6" height="6" rx="1.5"/><rect x="11.5" y="11.5" width="6" height="6" rx="1.5"/></S>;
export const IconBriefcase = p => <S {...p}><rect x="2.5" y="6" width="15" height="11" rx="2"/><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6M2.5 10.5h15"/></S>;
export const IconUsers = p => <S {...p}><circle cx="8" cy="7" r="2.8"/><path d="M2.8 16.5c0-2.6 2.3-4.4 5.2-4.4s5.2 1.8 5.2 4.4"/><path d="M14 4.6a2.8 2.8 0 0 1 0 5.3M15.2 12.6c1.4.6 2.3 1.8 2.3 3.4"/></S>;
export const IconSpark = p => <S {...p}><path d="M10 2.5 11.9 7l4.6 1.5L11.9 10l-1.9 4.5L8.1 10 3.5 8.5 8.1 7 10 2.5Z"/><path d="M15.5 13.5 16.3 15.5 18 16.3 16.3 17 15.5 18.8 14.8 17 13 16.3 14.8 15.5 15.5 13.5"/></S>;
export const IconPlus = p => <S {...p}><path d="M10 4v12M4 10h12"/></S>;
export const IconSearch = p => <S {...p}><circle cx="9" cy="9" r="5.5"/><path d="m13.2 13.2 3.3 3.3"/></S>;
export const IconClose = p => <S {...p}><path d="m5 5 10 10M15 5 5 15"/></S>;
export const IconCheck = p => <S {...p}><path d="m4 10.5 4 4 8-9"/></S>;
export const IconAlert = p => <S {...p}><path d="M10 3.2 18 16.8H2L10 3.2Z"/><path d="M10 8v3.4M10 14.2v.1"/></S>;
export const IconOut = p => <S {...p}><path d="M12 14v2a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3 16V4a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 12 4v2"/><path d="M8 10h9m0 0-2.8-2.8M17 10l-2.8 2.8"/></S>;
export const IconEmpty = p => <S {...p}><rect x="2.5" y="4.5" width="15" height="12" rx="2"/><path d="M2.5 9h15M7 13h6"/></S>;
export const IconEdit = p => <S {...p}><path d="M13.6 3.6a1.9 1.9 0 0 1 2.8 2.8L7.5 15.3l-3.6.8.8-3.6 8.9-8.9Z"/></S>;
export const IconTrash = p => <S {...p}><path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5 6.2 16a1.4 1.4 0 0 0 1.4 1.3h4.8A1.4 1.4 0 0 0 13.8 16l.7-10.5"/></S>;
export const IconStar = ({ filled, ...p }) => (
  <svg viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
    strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="m10 2.8 2.3 4.7 5.2.8-3.8 3.6.9 5.1L10 14.6l-4.6 2.4.9-5.1L2.5 8.3l5.2-.8L10 2.8Z"/></svg>
);
