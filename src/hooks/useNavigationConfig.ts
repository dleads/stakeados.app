import { useState, useEffect, useCallback } from 'react';
import type { NavigationConfig, NavigationSection, UserMenuItem } from '@/types/navigation';
import { 
  navigationConfigManager, 
  type BadgeVariant, 
  type NavigationConfigUpdate 
} from '@/lib/navigation/config-manager';

// Hook for managing navigation configuration
export function useNavigationConfig() {
  const [config, setConfig] = useState<NavigationConfig>(() => 
    navigationConfigManager.getConfig()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to configuration changes
  useEffect(() => {
    const unsubscribe = navigationConfigManager.subscribe(setConfig);
    return unsubscribe;
  }, []);

  // Update navigation section
  const updateSection = useCallback(async (
    sectionId: string, 
    updates: Partial<NavigationSection>
  ) => {
    setIsLoading(true);
    try {
      navigationConfigManager.updateSection(sectionId, updates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user menu item
  const updateUserMenuItem = useCallback(async (
    itemId: string, 
    updates: Partial<UserMenuItem>
  ) => {
    setIsLoading(true);
    try {
      navigationConfigManager.updateUserMenuItem(itemId, updates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update admin menu item
  const updateAdminMenuItem = useCallback(async (
    itemId: string, 
    updates: Partial<UserMenuItem>
  ) => {
    setIsLoading(true);
    try {
      navigationConfigManager.updateAdminMenuItem(itemId, updates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle section implementation status
  const toggleSection = useCallback(async (sectionId: string, isImplemented: boolean) => {
    setIsLoading(true);
    try {
      navigationConfigManager.toggleSection(sectionId, isImplemented);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle user menu item implementation status
  const toggleUserMenuItem = useCallback(async (itemId: string, isImplemented: boolean) => {
    setIsLoading(true);
    try {
      navigationConfigManager.toggleUserMenuItem(itemId, isImplemented);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle admin menu item implementation status
  const toggleAdminMenuItem = useCallback(async (itemId: string, isImplemented: boolean) => {
    setIsLoading(true);
    try {
      navigationConfigManager.toggleAdminMenuItem(itemId, isImplemented);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add badge to section
  const addSectionBadge = useCallback(async (
    sectionId: string, 
    text: string, 
    variant: BadgeVariant
  ) => {
    setIsLoading(true);
    try {
      navigationConfigManager.addSectionBadge(sectionId, text, variant);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove badge from section
  const removeSectionBadge = useCallback(async (sectionId: string) => {
    setIsLoading(true);
    try {
      navigationConfigManager.removeSectionBadge(sectionId);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add role requirements to section
  const addRoleRequirement = useCallback(async (sectionId: string, roles: string[]) => {
    setIsLoading(true);
    try {
      navigationConfigManager.addRoleRequirement(sectionId, roles);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove role requirements from section
  const removeRoleRequirement = useCallback(async (sectionId: string) => {
    setIsLoading(true);
    try {
      navigationConfigManager.removeRoleRequirement(sectionId);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set authentication requirement for section
  const setAuthRequirement = useCallback(async (sectionId: string, requiredAuth: boolean) => {
    setIsLoading(true);
    try {
      navigationConfigManager.setAuthRequirement(sectionId, requiredAuth);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bulk update multiple items
  const bulkUpdate = useCallback(async (updates: NavigationConfigUpdate[]) => {
    setIsLoading(true);
    try {
      navigationConfigManager.bulkUpdate(updates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset to default configuration
  const resetToDefault = useCallback(async () => {
    setIsLoading(true);
    try {
      navigationConfigManager.resetToDefault();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Export configuration
  const exportConfig = useCallback(() => {
    return navigationConfigManager.exportConfig();
  }, []);

  // Import configuration
  const importConfig = useCallback(async (configJson: string) => {
    setIsLoading(true);
    try {
      return navigationConfigManager.importConfig(configJson);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get configuration statistics
  const getStats = useCallback(() => {
    return navigationConfigManager.getConfigStats();
  }, []);

  // Get implemented sections
  const getImplementedSections = useCallback(() => {
    return navigationConfigManager.getImplementedSections();
  }, []);

  // Get unimplemented sections
  const getUnimplementedSections = useCallback(() => {
    return navigationConfigManager.getUnimplementedSections();
  }, []);

  // Get sections with badges
  const getSectionsWithBadges = useCallback(() => {
    return navigationConfigManager.getSectionsWithBadges();
  }, []);

  return {
    // Current configuration
    config,
    isLoading,

    // Update methods
    updateSection,
    updateUserMenuItem,
    updateAdminMenuItem,

    // Toggle methods
    toggleSection,
    toggleUserMenuItem,
    toggleAdminMenuItem,

    // Badge methods
    addSectionBadge,
    removeSectionBadge,

    // Role and auth methods
    addRoleRequirement,
    removeRoleRequirement,
    setAuthRequirement,

    // Bulk operations
    bulkUpdate,
    resetToDefault,

    // Import/Export
    exportConfig,
    importConfig,

    // Statistics and filtering
    getStats,
    getImplementedSections,
    getUnimplementedSections,
    getSectionsWithBadges,
  };
}

// Hook for navigation configuration statistics
export function useNavigationStats() {
  const [stats, setStats] = useState(() => 
    navigationConfigManager.getConfigStats()
  );

  useEffect(() => {
    const unsubscribe = navigationConfigManager.subscribe(() => {
      setStats(navigationConfigManager.getConfigStats());
    });
    return unsubscribe;
  }, []);

  return stats;
}

// Hook for checking if a section is implemented
export function useIsImplemented(sectionId: string) {
  const { config } = useNavigationConfig();
  
  const isImplemented = config.sections.find(section => {
    if (section.id === sectionId) return section.isImplemented;
    if (section.children) {
      return section.children.find(child => child.id === sectionId)?.isImplemented;
    }
    return false;
  });

  return Boolean(isImplemented);
}

// Hook for getting section badge
export function useSectionBadge(sectionId: string) {
  const { config } = useNavigationConfig();
  
  const section = config.sections.find(section => {
    if (section.id === sectionId) return section;
    if (section.children) {
      return section.children.find(child => child.id === sectionId);
    }
    return null;
  });

  return section?.badge || null;
}