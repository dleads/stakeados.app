import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = rows
    .map(r => headers.map(h => escape(r[h])).join(','))
    .join('\n');
  return headers.join(',') + '\n' + body;
}

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 401 as const };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !profile.role || !['admin', 'editor'].includes(profile.role))
    return { status: 403 as const };
  return { status: 200 as const };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.status !== 200)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: auth.status }
    );
  const { type, format = 'csv', from, to } = await request.json();
  const supabase = createClient();
  let data: any[] = [];
  if (type === 'articles') {
    const { data: d } = await supabase
      .from('articles')
      .select('id,title,status,created_at,published_at')
      .gte('created_at', from || '1970-01-01')
      .lte('created_at', to || new Date().toISOString());
    data = d || [];
  } else if (type === 'news') {
    const { data: d } = await supabase
      .from('news')
      .select('id,title,source_name,published_at,created_at')
      .gte('created_at', from || '1970-01-01')
      .lte('created_at', to || new Date().toISOString());
    data = d || [];
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  if (format === 'json') return NextResponse.json(data);
  const csv = toCSV(data);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}.csv"`,
    },
  });
}
