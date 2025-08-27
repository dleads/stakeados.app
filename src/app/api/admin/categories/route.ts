import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/lib/services/categoryService';
import { requireAdmin } from '@/lib/auth/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const withStats = searchParams.get('withStats') === 'true';
    const hierarchical = searchParams.get('hierarchical') === 'true';
    const withCounts = searchParams.get('withCounts') === 'true';

    if (withStats) {
      const stats = await categoryService.getCategoryStats();
      return NextResponse.json(stats);
    }

    if (withCounts) {
      const categories = await categoryService.getCategoriesWithCounts();
      return NextResponse.json(categories);
    }

    const categories = hierarchical
      ? await categoryService.getCategoriesHierarchical(includeInactive)
      : await categoryService.getCategories(includeInactive);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const category = await categoryService.createCategory(body);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create category',
      },
      { status: 500 }
    );
  }
}
