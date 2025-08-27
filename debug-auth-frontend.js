// Debug Authentication Frontend
// Run this in the browser console on your admin page

// 1. Check if Supabase is available
console.log(
  'Supabase available:',
  typeof window !== 'undefined' && window.supabase
);

// 2. Check current session
async function checkAuth() {
  try {
    const {
      data: { session },
      error,
    } = await window.supabase.auth.getSession();

    console.log('=== AUTH STATUS ===');
    console.log('Session:', session);
    console.log('Error:', error);
    console.log('User ID:', session?.user?.id);
    console.log('User Email:', session?.user?.email);

    if (session?.user) {
      // 3. Check user profile
      const { data: profile, error: profileError } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      console.log('=== PROFILE ===');
      console.log('Profile:', profile);
      console.log('Profile Error:', profileError);
      console.log('User Role:', profile?.role);

      // 4. Test category creation
      const { data: testCategory, error: testError } = await window.supabase
        .from('content_categories')
        .insert({
          name: { en: 'Test Category', es: 'Categoría de Prueba' },
          slug: 'test-category-' + Date.now(),
          description: { en: 'Test', es: 'Prueba' },
          color: '#FF0000',
          order_index: 999,
        })
        .select()
        .single();

      console.log('=== TEST CATEGORY CREATION ===');
      console.log('Test Category:', testCategory);
      console.log('Test Error:', testError);

      // 5. Clean up test category
      if (testCategory) {
        const { error: deleteError } = await window.supabase
          .from('content_categories')
          .delete()
          .eq('id', testCategory.id);

        console.log('Delete Error:', deleteError);
      }
    } else {
      console.log('No session found - user not authenticated');
    }
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}

// Run the check
checkAuth();

// 6. Also check if we can access the supabase instance from the app
console.log('=== APP SUPABASE ===');
console.log('Window supabase:', window.supabase);
console.log('App supabase client:', window.__NEXT_DATA__?.props?.supabase);
