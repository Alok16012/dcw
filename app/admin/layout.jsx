import './admin.css';
import AdminShell from './AdminShell.jsx';

export const metadata = { title: 'Console', robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
