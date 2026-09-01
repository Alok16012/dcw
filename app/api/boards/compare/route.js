import { boards } from '@/lib/store.js';
import { ok } from '@/lib/http.js';

export async function GET() {
  const fields = ['recognition', 'examFrequency', 'resultDays', 'fee', 'tcRequired', 'bestFor'];
  const rows = fields.map(f => {
    const values = boards.map(b => b[f]);
    return { field: f, values, differs: new Set(values.map(String)).size > 1 };
  });
  return ok({ boards, rows });
}
