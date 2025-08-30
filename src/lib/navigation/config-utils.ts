import { navigationConfigManager, type BadgeVariant } from './config-manager';
import type { NavigationSection, UserMenuItem } from '@/types/navigation';

/**
 * Utility functions for managing navigation configuration
 * These functions provide a simple API for common configuration tasks
 */

// Section management
export const enableSection = (sectionId: string) => {
  navigationConfigManager.toggleSection(sectionId, true);
};

export const disableSection = (sectionId: string) => {
  navigationConfigManager.toggleSection(sectionId, false);
};

export const setSectionBadge = (sectionId: string, text: string, variant: BadgeVariant) => {
  navigationConfigManager.addSectionBadge(sectionId, text, variant);
};

export const removeSectionBadge = (sectionId: string) => {
  navigationConfigManager.removeSectionBadge(sectionId);
};

// User menu management
export const enableUserMenuItem = (itemId: string) => {
  navigationConfigManager.toggleUserMenuItem(itemId, true);
};

export const disableUserMenuItem = (itemId: string) => {
  navigationConfigManager.toggleUserMenuItem(itemId, false);
};

// Admin menu management
export const enableAdminMenuItem = (itemId: string) => {
  navigationConfigManager.toggleAdminMenuItem(itemId, true);
};

export const disableAdminMenuItem = (itemId: string) => {
  navigationConfigManager.toggleAdminMenuItem(itemId, false);
};

// Role management
export const setSectionRoles = (sectionId: string, roles: string[]) => {
  navigationConfigManager.addRoleRequirement(sectionId, roles);
};

export const removeSectionRoles = (sectionId: string) => {
  navigationConfigManager.removeRoleRequirement(sectionId);
};

// Authentication requirements
export const requireAuth = (sectionId: string) => {
  navigationConfigManager.setAuthRequirement(sectionId, true);
};

export const removeAuthRequirement = (sectionId: string) => {
  navigationConfigManager.setAuthRequirement(sectionId, false);
};

// Bulk operations for feature rollouts
export const enableFeature = (featureConfig: {
  sections?: string[];
  userMenuItems?: string[];
  adminMenuItems?: string[];
  badge?: { text: string; variant: BadgeVariant };
}) => {
  const updates = [];

  // Enable sections
  if (featureConfig.sections) {
    featureConfig.sections.forEach(sectionId => {
      updates.push({
        type: 'section' as const,
        sectionId,
        updates: { 
          isImplemented: true,
          ...(featureConfig.badge && { badge: featureConfig.badge })
        }
      });
    });
  }

  // Enable user menu items
  if (featureConfig.userMenuItems) {
    featureConfig.userMenuItems.forEach(itemId => {
      updates.push({
        type: 'userMenuItem' as const,
        itemId,
        updates: { isImplemented: true }
      });
    });
  }

  // Enable admin menu items
  if (featureConfig.adminMenuItems) {
    featureConfig.adminMenuItems.forEach(itemId => {
      updates.push({
        type: 'adminMenuItem' as const,
        itemId,
        updates: { isImplemented: true }
      });
    });
  }

  if (updates.length > 0) {
    navigationConfigManager.bulkUpdate(updates);
  }
};

export const disableFeature = (featureConfig: {
  sections?: string[];
  userMenuItems?: string[];
  adminMenuItems?: string[];
}) => {
  const updates = [];

  // Disable sections
  if (featureConfig.sections) {
    featureConfig.sections.forEach(sectionId => {
      updates.push({
        type: 'section' as const,
        sectionId,
        updates: { isImplemented: false }
      });
    });
  }

  // Disable user menu items
  if (featureConfig.userMenuItems) {
    featureConfig.userMenuItems.forEach(itemId => {
      updates.push({
        type: 'userMenuItem' as const,
        itemId,
        updates: { isImplemented: false }
      });
    });
  }

  // Disable admin menu items
  if (featureConfig.adminMenuItems) {
    featureConfig.adminMenuItems.forEach(itemId => {
      updates.push({
        type: 'adminMenuItem' as const,
        itemId,
        updates: { isImplemented: false }
      });
    });
  }

  if (updates.length > 0) {
    navigationConfigManager.bulkUpdate(updates);
  }
};

// Feature rollout helpers
export const rolloutArticleSystem = () => {
  enableFeature({
    sections: ['articles', 'articles-list', 'articles-categories'],
    badge: { text: 'Nuevo', variant: 'new' }
  });
};

export const rolloutNewsSystem = () => {
  enableFeature({
    sections: ['news'],
    badge: { text: 'Nuevo', variant: 'new' }
  });
};

export const rolloutCommunityFeatures = () => {
  enableFeature({
    sections: ['community'],
    badge: { text: 'Beta', variant: 'beta' }
  });
};

export const rolloutCourseSystem = () => {
  enableFeature({
    sections: ['courses'],
    badge: { text: 'Nuevo', variant: 'new' }
  });
};

export const rolloutUserProfile = () => {
  enableFeature({
    userMenuItems: ['profile', 'settings']
  });
};

export const rolloutAdminFeatures = () => {
  enableFeature({
    adminMenuItems: ['admin-users', 'admin-content', 'admin-analytics', 'admin-settings']
  });
};

// Configuration presets for different environments
export const applyDevelopmentConfig = () => {
  // Enable all features for development
  enableFeature({
    sections: ['articles', 'news', 'community', 'courses'],
    userMenuItems: ['profile', 'settings'],
    adminMenuItems: ['admin-users', 'admin-content', 'admin-analytics', 'admin-settings'],
    badge: { text: 'Dev', variant: 'beta' }
  });
};

export const applyProductionConfig = () => {
  // Only enable implemented features for production
  const config = navigationConfigManager.getConfig();
  
  // Reset all to false first
  disableFeature({
    sections: config.sections.map(s => s.id),
    userMenuItems: config.userMenuItems.map(i => i.id),
    adminMenuItems: config.adminMenuItems.map(i => i.id)
  });

  // Enable only core features that are ready
  enableFeature({
    sections: ['home'], // Only home is guaranteed to work
    userMenuItems: ['logout'], // Logout should always work
    adminMenuItems: ['admin-dashboard'] // Basic admin panel
  });
};

export const applyStagingConfig = () => {
  // Enable features that are ready for testing
  enableFeature({
    sections: ['articles', 'news'], // Features ready for testing
    userMenuItems: ['profile'],
    adminMenuItems: ['admin-dashboard', 'admin-users'],
    badge: { text: 'Beta', variant: 'beta' }
  });
};

// Configuration validation
export const validateConfiguration = () => {
  const config = navigationConfigManager.getConfig();
  const issues = [];

  // Check for sections without proper configuration
  config.sections.forEach(section => {
    if (section.isImplemented && section.requiredAuth && !section.requiredRoles) {
      issues.push(`Section "${section.label}" requires auth but has no role restrictions`);
    }
    
    if (section.children) {
      section.children.forEach(child => {
        if (child.isImplemented && !section.isImplemented) {
          issues.push(`Child section "${child.label}" is enabled but parent "${section.label}" is disabled`);
        }
      });
    }
  });

  // Check for menu items without proper configuration
  config.userMenuItems.forEach(item => {
    if (item.isImplemented && item.requiredAuth && item.href === '#' && !item.action) {
      issues.push(`User menu item "${item.label}" has no valid href or action`);
    }
  });

  config.adminMenuItems.forEach(item => {
    if (item.isImplemented && item.href === '#') {
      issues.push(`Admin menu item "${item.label}" has no valid href`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
};

// Get configuration summary for debugging
export const getConfigurationSummary = () => {
  const config = navigationConfigManager.getConfig();
  const stats = navigationConfigManager.getConfigStats();
  
  return {
    stats,
    implementedSections: config.sections.filter(s => s.isImplemented).map(s => s.label),
    unimplementedSections: config.sections.filter(s => !s.isImplemented).map(s => s.label),
    sectionsWithBadges: config.sections.filter(s => s.badge).map(s => ({
      label: s.label,
      badge: s.badge
    })),
    implementedUserItems: config.userMenuItems.filter(i => i.isImplemented).map(i => i.label),
    implementedAdminItems: config.adminMenuItems.filter(i => i.isImplemented).map(i => i.label),
  };
};