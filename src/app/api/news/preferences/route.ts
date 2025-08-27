import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getUser } from '../../../../lib/supabase/auth';

export interface NewsPreferences {
  categories: string[];
  keywords: string[];
  sources: string[];
  minRelevanceScore: number;
  excludeKeywords: string[];
  preferredLanguage: 'en' | 'es';
  notificationSettings: {
    breakingNews: boolean;
    dailyDigest: boolean;
    weeklyRoundup: boolean;
  };
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Get user preferences from user_subscriptions table
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('subscription_type, subscription_target')
      .eq('user_id', user.id);

    if (subscriptionsError) {
      console.error('Error fetching user subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Get user profile for additional preferences
    // Note: preferences column doesn't exist in profiles table
    // This query is commented out to fix build issues
    /*
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }
    */

    // Parse subscriptions into preferences
    const categories =
      subscriptions
        ?.filter(sub => sub.subscription_type === 'category')
        .map(sub => sub.subscription_target) || [];

    const keywords =
      subscriptions
        ?.filter(sub => sub.subscription_type === 'tag')
        .map(sub => sub.subscription_target) || [];

    const sources =
      subscriptions
        ?.filter(sub => sub.subscription_type === 'author')
        .map(sub => sub.subscription_target) || [];

    // Get stored preferences from profile
    // Note: preferences column doesn't exist in profiles table

    const preferences: NewsPreferences = {
      categories,
      keywords,
      sources,
      minRelevanceScore: 6,
      excludeKeywords: [],
      preferredLanguage: 'en',
      notificationSettings: {
        breakingNews: true,
        dailyDigest: false,
        weeklyRoundup: true,
      },
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Unexpected error in news preferences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const preferences: NewsPreferences = await request.json();
    const supabase = createClient();

    // Update user subscriptions
    // First, delete existing subscriptions
    await supabase.from('user_subscriptions').delete().eq('user_id', user.id);

    // Insert new subscriptions
    const subscriptionsToInsert = [
      ...preferences.categories.map(category => ({
        user_id: user.id,
        subscription_type: 'category' as const,
        subscription_target: category,
      })),
      ...preferences.keywords.map(keyword => ({
        user_id: user.id,
        subscription_type: 'tag' as const,
        subscription_target: keyword,
      })),
      ...preferences.sources.map(source => ({
        user_id: user.id,
        subscription_type: 'author' as const,
        subscription_target: source,
      })),
    ];

    if (subscriptionsToInsert.length > 0) {
      const { error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionsToInsert);

      if (subscriptionsError) {
        console.error('Error updating user subscriptions:', subscriptionsError);
        return NextResponse.json(
          { error: 'Failed to update subscriptions' },
          { status: 500 }
        );
      }
    }

    // Update profile preferences
    const profilePreferences = {
      minRelevanceScore: preferences.minRelevanceScore,
      excludeKeywords: preferences.excludeKeywords,
      preferredLanguage: preferences.preferredLanguage,
      notificationSettings: preferences.notificationSettings,
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        preferences: profilePreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating user profile preferences:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error updating news preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
