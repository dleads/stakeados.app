import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  _request: NextRequest, // Required for Next.js API route signature
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar rol de admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener la fuente
    const { data: source, error: sourceError } = await supabase
      .from('news_sources')
      .select('*')
      .eq('id', params.id)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    if (!source.is_active) {
      return NextResponse.json(
        { error: 'Source is inactive' },
        { status: 400 }
      );
    }

    // Simular fetch inmediato (en un entorno real, aquí se haría el fetch real)
    const startTime = Date.now();
    let success = false;
    let articlesFetched = 0;
    let errorMessage = '';

    try {
      // Simular tiempo de fetch
      await new Promise(resolve =>
        setTimeout(resolve, 500 + Math.random() * 1000)
      );

      // Simular resultado del fetch
      success = Math.random() > 0.1; // 90% de éxito
      articlesFetched = success ? Math.floor(Math.random() * 15) + 1 : 0;

      if (success && articlesFetched > 0) {
        // Simular creación de noticias (en producción, aquí se procesarían los artículos reales)
        const mockArticles = Array.from(
          { length: articlesFetched },
          (_, i) => ({
            title: `Artículo de prueba ${i + 1} de ${source.name}`,
            content: `Contenido del artículo de prueba ${i + 1}`,
            summary: `Resumen del artículo ${i + 1}`,
            source_name: source.name,
            source_url: source.url,
            processed: false,
            trending_score: Math.floor(Math.random() * 100),
            language: 'es',
            published_at: new Date().toISOString(),
          })
        );

        // Insertar noticias simuladas
        const { error: insertError } = await supabase
          .from('news')
          .insert(mockArticles);

        if (insertError) {
          console.error('Error inserting mock articles:', insertError);
        }
      }
    } catch (error) {
      success = false;
      errorMessage = 'Fetch failed';
    }

    // Actualizar el estado de la fuente
    await supabase
      .from('news_sources')
      .update({
        fetch_status: success ? 'success' : 'error',
        error_message: errorMessage || null,
        last_fetched_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    return NextResponse.json({
      success,
      articles_fetched: articlesFetched,
      fetch_time: Date.now() - startTime,
      error_message: errorMessage || null,
    });
  } catch (error) {
    console.error('Error in news source fetch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
