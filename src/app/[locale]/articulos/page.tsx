// Spanish route redirect to articles
import { redirect } from 'next/navigation';

export default function ArticulosPage({
  params,
}: {
  params: { locale: string };
}) {
  // Redirect Spanish articulos to articles with locale
  redirect(`/${params.locale}/articles`);
}
