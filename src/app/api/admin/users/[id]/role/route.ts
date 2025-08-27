import { NextRequest, NextResponse } from 'next/server';
import { updateUserRole } from '@/lib/services/userService';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin.success)
    return NextResponse.json(
      { error: admin.error || 'Unauthorized' },
      { status: admin.status || 401 }
    );
  const { role } = await request.json();
  if (!['admin', 'editor', 'user'].includes(role))
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  const data = await updateUserRole(params.id, role);
  return NextResponse.json(data);
}
