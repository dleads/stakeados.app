import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { DatabaseExtended } from '@/types/database-extended';

// Instanciación directa para evitar estados null/undefined
const supabaseInstance = createClientComponentClient<DatabaseExtended>();

// Exportamos sin anotaciones explícitas de SupabaseClient para mantener la compatibilidad
// con la firma de tipos de auth-helpers y evitar desajustes de genéricos.
export const createClient = () => supabaseInstance;

// Instancia por defecto
export const supabase = supabaseInstance;
