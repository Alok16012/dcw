import { Suspense } from 'react';
import './admin.css';
import AdminShell from './AdminShell.jsx';

export const metadata = { title: 'Console', robots: { index: false, follow: false } };

/* AdminShell reads ?site= to pick which website it manages; useSearchParams
   needs a Suspense boundary above it. */
export default function AdminLayout({ children }) {
  return <Suspense fallback={null}><AdminShell>{children}</AdminShell></Suspense>;
}
