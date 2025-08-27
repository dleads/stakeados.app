import { NextRequest, NextResponse } from 'next/server';

// Tags functionality not implemented - tables don't exist in database
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Tags functionality not available - tables do not exist in database',
    },
    { status: 501 }
  );
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Tags functionality not available - tables do not exist in database',
    },
    { status: 501 }
  );
}
