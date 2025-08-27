import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Auth API - Iniciando...');

    const authResult = await requireAdmin(request);

    if (!authResult.success) {
      console.log('🔍 Test Auth API - Auth failed:', authResult);
      return NextResponse.json(
        {
          error: authResult.error,
          step: authResult.step,
          details: authResult.error,
        },
        { status: authResult.status }
      );
    }

    console.log('🔍 Test Auth API - Auth successful:', authResult.user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        role: authResult.profile?.role || 'unknown',
      },
      message: 'Authentication successful',
      step: 'success',
    });
  } catch (error) {
    console.error('🔍 Test Auth API - Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'unexpected_error',
      },
      { status: 500 }
    );
  }
}
