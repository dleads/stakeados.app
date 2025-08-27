-- Verificar si existe el usuario en auth.users
SELECT 'Checking auth user' as step;

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@stakeados.com';

-- Verificar si existe la función get_category_stats
SELECT 'Checking get_category_stats function' as step;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_category_stats' 
  AND routine_schema = 'public';

-- Crear la función si no existe
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (
  id uuid,
  name jsonb,
  article_count bigint,
  news_count bigint,
  total_views bigint,
  total_interactions bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    cc.id,
    cc.name,
    COALESCE(COUNT(DISTINCT ac.article_id), 0) as article_count,
    COALESCE(COUNT(DISTINCT nc.news_id), 0) as news_count,
    COALESCE(SUM(ci.interaction_count), 0) as total_views,
    COALESCE(COUNT(ci.id), 0) as total_interactions
  FROM content_categories cc
  LEFT JOIN article_categories ac ON cc.id = ac.category_id
  LEFT JOIN news_categories nc ON cc.id = nc.category_id
  LEFT JOIN content_interactions ci ON (
    (ci.content_type = 'article' AND ci.content_id = ac.article_id) OR
    (ci.content_type = 'news' AND ci.content_id = nc.news_id)
  )
  GROUP BY cc.id, cc.name
  ORDER BY cc.order_index;
$$;

-- Verificar que se creó la función
SELECT 'Function created successfully' as status;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_category_stats' 
  AND routine_schema = 'public';
