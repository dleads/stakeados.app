'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthContext } from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  Settings,
  User,
  Bell,
  Shield,
  Save,
  Eye,
  Mail,
  Smartphone,
  Lock,
  Award,
  Palette,
} from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations();
  const { profile, updateProfile } = useAuthContext();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'notifications' | 'privacy' | 'preferences'
  >('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    display_name: profile?.display_name || '',
    avatar_url: profile?.avatar_url || '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    course_updates: true,
    achievement_alerts: true,
    community_updates: false,
    marketing_emails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_progress: true,
    show_achievements: true,
    show_wallet_address: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'dark',
    timezone: 'UTC',
    currency: 'USD',
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfile(profileData);
      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess('Profile updated successfully!');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-gaming py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Settings className="w-12 h-12 text-stakeados-primary" />
                <h1 className="text-4xl md:text-5xl font-bold text-neon">
                  {t('common.settings')}
                </h1>
              </div>
              <p className="text-xl text-stakeados-gray-300">
                Manage your account preferences and privacy settings
              </p>
            </div>

            {/* Messages */}
            {(error || success) && (
              <div className="mb-6">
                {error && (
                  <div className="notification-error mb-3">
                    <div className="flex items-center justify-between">
                      <span>{error}</span>
                      <button
                        onClick={clearMessages}
                        className="text-stakeados-red hover:text-stakeados-red/80"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
                {success && (
                  <div className="notification-success mb-3">
                    <div className="flex items-center justify-between">
                      <span>{success}</span>
                      <button
                        onClick={clearMessages}
                        className="text-stakeados-primary hover:text-stakeados-primary/80"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <div className="card-gaming">
                  <h3 className="text-lg font-bold text-neon mb-4">Settings</h3>
                  <nav className="space-y-2">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-gaming transition-colors ${
                        activeTab === 'profile'
                          ? 'bg-stakeados-primary text-stakeados-dark'
                          : 'text-stakeados-gray-300 hover:bg-stakeados-gray-700'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-gaming transition-colors ${
                        activeTab === 'notifications'
                          ? 'bg-stakeados-primary text-stakeados-dark'
                          : 'text-stakeados-gray-300 hover:bg-stakeados-gray-700'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      Notifications
                    </button>
                    <button
                      onClick={() => setActiveTab('privacy')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-gaming transition-colors ${
                        activeTab === 'privacy'
                          ? 'bg-stakeados-primary text-stakeados-dark'
                          : 'text-stakeados-gray-300 hover:bg-stakeados-gray-700'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      Privacy
                    </button>
                    <button
                      onClick={() => setActiveTab('preferences')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-gaming transition-colors ${
                        activeTab === 'preferences'
                          ? 'bg-stakeados-primary text-stakeados-dark'
                          : 'text-stakeados-gray-300 hover:bg-stakeados-gray-700'
                      }`}
                    >
                      <Palette className="w-4 h-4" />
                      Preferences
                    </button>
                  </nav>
                </div>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-3">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div className="card-gaming">
                    <h3 className="text-xl font-bold text-neon mb-6">
                      Profile Settings
                    </h3>

                    <div className="space-y-6">
                      <div className="form-gaming">
                        <label htmlFor="display_name">Display Name</label>
                        <input
                          type="text"
                          id="display_name"
                          value={profileData.display_name}
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              display_name: e.target.value,
                            }))
                          }
                          placeholder="Your display name"
                        />
                      </div>

                      <div className="form-gaming">
                        <label htmlFor="avatar_url">Avatar URL</label>
                        <input
                          type="url"
                          id="avatar_url"
                          value={profileData.avatar_url}
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              avatar_url: e.target.value,
                            }))
                          }
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="btn-primary"
                      >
                        {isSaving ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-stakeados-dark border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Save Profile
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div className="card-gaming">
                    <h3 className="text-xl font-bold text-neon mb-6">
                      Notification Settings
                    </h3>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-stakeados-primary">
                          General Notifications
                        </h4>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-stakeados-blue" />
                            <div>
                              <div className="font-medium text-white">
                                Email Notifications
                              </div>
                              <div className="text-sm text-stakeados-gray-400">
                                Receive notifications via email
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.email_notifications}
                            onChange={e =>
                              setNotificationSettings(prev => ({
                                ...prev,
                                email_notifications: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-stakeados-purple" />
                            <div>
                              <div className="font-medium text-white">
                                Push Notifications
                              </div>
                              <div className="text-sm text-stakeados-gray-400">
                                Receive push notifications
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.push_notifications}
                            onChange={e =>
                              setNotificationSettings(prev => ({
                                ...prev,
                                push_notifications: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-stakeados-primary">
                          Content Notifications
                        </h4>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">
                              Course Updates
                            </div>
                            <div className="text-sm text-stakeados-gray-400">
                              New courses and content
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.course_updates}
                            onChange={e =>
                              setNotificationSettings(prev => ({
                                ...prev,
                                course_updates: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">
                              Achievement Alerts
                            </div>
                            <div className="text-sm text-stakeados-gray-400">
                              When you unlock achievements
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.achievement_alerts}
                            onChange={e =>
                              setNotificationSettings(prev => ({
                                ...prev,
                                achievement_alerts: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">
                              Community Updates
                            </div>
                            <div className="text-sm text-stakeados-gray-400">
                              Community news and events
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.community_updates}
                            onChange={e =>
                              setNotificationSettings(prev => ({
                                ...prev,
                                community_updates: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div className="card-gaming">
                    <h3 className="text-xl font-bold text-neon mb-6">
                      Privacy Settings
                    </h3>

                    <div className="space-y-6">
                      <div className="form-gaming">
                        <label htmlFor="profile_visibility">
                          Profile Visibility
                        </label>
                        <select
                          id="profile_visibility"
                          value={privacySettings.profile_visibility}
                          onChange={e =>
                            setPrivacySettings(prev => ({
                              ...prev,
                              profile_visibility: e.target.value,
                            }))
                          }
                        >
                          <option value="public">Public</option>
                          <option value="community">Community Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-stakeados-primary">
                          What Others Can See
                        </h4>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-stakeados-blue" />
                            <div>
                              <div className="font-medium text-white">
                                Learning Progress
                              </div>
                              <div className="text-sm text-stakeados-gray-400">
                                Show your course progress
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacySettings.show_progress}
                            onChange={e =>
                              setPrivacySettings(prev => ({
                                ...prev,
                                show_progress: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className="w-5 h-5 text-stakeados-yellow" />
                            <div>
                              <div className="font-medium text-white">
                                Achievements
                              </div>
                              <div className="text-sm text-stakeados-gray-400">
                                Show your achievements and badges
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacySettings.show_achievements}
                            onChange={e =>
                              setPrivacySettings(prev => ({
                                ...prev,
                                show_achievements: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-stakeados-red" />
                            <div>
                              <div className="font-medium text-white">
                                Wallet Address
                              </div>
                              <div className="text-sm text-stakeados-gray-400">
                                Show your wallet address publicly
                              </div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacySettings.show_wallet_address}
                            onChange={e =>
                              setPrivacySettings(prev => ({
                                ...prev,
                                show_wallet_address: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-stakeados-primary bg-stakeados-gray-800 border-stakeados-gray-600 rounded focus:ring-stakeados-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences */}
                {activeTab === 'preferences' && (
                  <div className="card-gaming">
                    <h3 className="text-xl font-bold text-neon mb-6">
                      Preferences
                    </h3>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-gaming">
                          <label htmlFor="language">Language</label>
                          <select
                            id="language"
                            value={preferences.language}
                            onChange={e =>
                              setPreferences(prev => ({
                                ...prev,
                                language: e.target.value,
                              }))
                            }
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                          </select>
                        </div>

                        <div className="form-gaming">
                          <label htmlFor="theme">Theme</label>
                          <select
                            id="theme"
                            value={preferences.theme}
                            onChange={e =>
                              setPreferences(prev => ({
                                ...prev,
                                theme: e.target.value,
                              }))
                            }
                          >
                            <option value="dark">Dark (Gaming)</option>
                            <option value="light">Light</option>
                            <option value="auto">Auto</option>
                          </select>
                        </div>

                        <div className="form-gaming">
                          <label htmlFor="timezone">Timezone</label>
                          <select
                            id="timezone"
                            value={preferences.timezone}
                            onChange={e =>
                              setPreferences(prev => ({
                                ...prev,
                                timezone: e.target.value,
                              }))
                            }
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">
                              Eastern Time
                            </option>
                            <option value="America/Los_Angeles">
                              Pacific Time
                            </option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Madrid">Madrid</option>
                          </select>
                        </div>

                        <div className="form-gaming">
                          <label htmlFor="currency">Currency</label>
                          <select
                            id="currency"
                            value={preferences.currency}
                            onChange={e =>
                              setPreferences(prev => ({
                                ...prev,
                                currency: e.target.value,
                              }))
                            }
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="ETH">ETH (Ξ)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
