// Spanish route redirect to articles
import { redirect } from 'next/navigation';

export default function ArticuloPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  // Redirect Spanish articulos to articles with locale
  redirect(`/${params.locale}/articles/${params.slug}`);
}
