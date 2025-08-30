import type { NavigationConfig, NavigationSection, UserMenuItem } from '@/types/navigation';
import { defaultNavigationConfig } from './config';

// Configuration storage key
const CONFIG_STORAGE_KEY = 'stakeados_navigation_config';

// Badge variants for navigation items
export type BadgeVariant = 'new' | 'beta' | 'coming-soon';

// Configuration update types
export interface NavigationConfigUpdate {
  sectionId?: string;
  itemId?: string;
  type: 'section' | 'userMenuItem' | 'adminMenuItem';
  updates: Partial<NavigationSection> | Partial<UserMenuItem>;
}

// Configuration manager class
export class NavigationConfigManager {
  private config: NavigationConfig;
  private listeners: Set<(config: NavigationConfig) => void> = new Set();

  constructor(initialConfig?: NavigationConfig) {
    this.config = initialConfig || this.loadConfig();
  }

  // Load configuration from storage or use default
  private loadConfig(): NavigationConfig {
    if (typeof window === 'undefined') {
      return defaultNavigationConfig;
    }

    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        // Merge with default config to ensure all properties exist
        return this.mergeWithDefault(parsedConfig);
      }
    } catch (error) {
      console.warn('Failed to load navigation config from storage:', error);
    }

    return defaultNavigationConfig;
  }

  // Save configuration to storage
  private saveConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save navigation config to storage:', error);
    }
  }

  // Merge stored config with default to ensure all properties exist
  private mergeWithDefault(storedConfig: Partial<NavigationConfig>): NavigationConfig {
    return {
      sections: storedConfig.sections || defaultNavigationConfig.sections,
      userMenuItems: storedConfig.userMenuItems || defaultNavigationConfig.userMenuItems,
      adminMenuItems: storedConfig.adminMenuItems || defaultNavigationConfig.adminMenuItems,
    };
  }

  // Notify listeners of config changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }

  // Get current configuration
  getConfig(): NavigationConfig {
    return { ...this.config };
  }

  // Subscribe to configuration changes
  subscribe(listener: (config: NavigationConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Update navigation section
  updateSection(sectionId: string, updates: Partial<NavigationSection>): void {
    this.config = {
      ...this.config,
      sections: this.config.sections.map(section =>
        section.id === sectionId
          ? { ...section, ...updates }
          : section.children
          ? {
              ...section,
              children: section.children.map(child =>
                child.id === sectionId ? { ...child, ...updates } : child
              )
            }
          : section
      ),
    };

    this.saveConfig();
    this.notifyListeners();
  }

  // Update user menu item
  updateUserMenuItem(itemId: string, updates: Partial<UserMenuItem>): void {
    this.config = {
      ...this.config,
      userMenuItems: this.config.userMenuItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    };

    this.saveConfig();
    this.notifyListeners();
  }

  // Update admin menu item
  updateAdminMenuItem(itemId: string, updates: Partial<UserMenuItem>): void {
    this.config = {
      ...this.config,
      adminMenuItems: this.config.adminMenuItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    };

    this.saveConfig();
    this.notifyListeners();
  }

  // Enable/disable navigation section
  toggleSection(sectionId: string, isImplemented: boolean): void {
    this.updateSection(sectionId, { isImplemented });
  }

  // Enable/disable user menu item
  toggleUserMenuItem(itemId: string, isImplemented: boolean): void {
    this.updateUserMenuItem(itemId, { isImplemented });
  }

  // Enable/disable admin menu item
  toggleAdminMenuItem(itemId: string, isImplemented: boolean): void {
    this.updateAdminMenuItem(itemId, { isImplemented });
  }

  // Add badge to navigation section
  addSectionBadge(sectionId: string, text: string, variant: BadgeVariant): void {
    this.updateSection(sectionId, {
      badge: { text, variant }
    });
  }

  // Remove badge from navigation section
  removeSectionBadge(sectionId: string): void {
    this.updateSection(sectionId, {
      badge: undefined
    });
  }

  // Add role requirements to section
  addRoleRequirement(sectionId: string, roles: string[]): void {
    this.updateSection(sectionId, {
      requiredRoles: roles
    });
  }

  // Remove role requirements from section
  removeRoleRequirement(sectionId: string): void {
    this.updateSection(sectionId, {
      requiredRoles: undefined
    });
  }

  // Set authentication requirement for section
  setAuthRequirement(sectionId: string, requiredAuth: boolean): void {
    this.updateSection(sectionId, {
      requiredAuth
    });
  }

  // Bulk update multiple items
  bulkUpdate(updates: NavigationConfigUpdate[]): void {
    let newConfig = { ...this.config };

    updates.forEach(update => {
      switch (update.type) {
        case 'section':
          if (update.sectionId) {
            newConfig = {
              ...newConfig,
              sections: newConfig.sections.map(section =>
                section.id === update.sectionId
                  ? { ...section, ...update.updates }
                  : section.children
                  ? {
                      ...section,
                      children: section.children.map(child =>
                        child.id === update.sectionId
                          ? { ...child, ...update.updates }
                          : child
                      )
                    }
                  : section
              ),
            };
          }
          break;

        case 'userMenuItem':
          if (update.itemId) {
            newConfig = {
              ...newConfig,
              userMenuItems: newConfig.userMenuItems.map(item =>
                item.id === update.itemId
                  ? { ...item, ...update.updates }
                  : item
              ),
            };
          }
          break;

        case 'adminMenuItem':
          if (update.itemId) {
            newConfig = {
              ...newConfig,
              adminMenuItems: newConfig.adminMenuItems.map(item =>
                item.id === update.itemId
                  ? { ...item, ...update.updates }
                  : item
              ),
            };
          }
          break;
      }
    });

    this.config = newConfig;
    this.saveConfig();
    this.notifyListeners();
  }

  // Reset to default configuration
  resetToDefault(): void {
    this.config = { ...defaultNavigationConfig };
    this.saveConfig();
    this.notifyListeners();
  }

  // Export configuration as JSON
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Import configuration from JSON
  importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      
      // Validate the imported config structure
      if (this.validateConfig(importedConfig)) {
        this.config = importedConfig;
        this.saveConfig();
        this.notifyListeners();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import navigation config:', error);
      return false;
    }
  }

  // Validate configuration structure
  private validateConfig(config: any): config is NavigationConfig {
    return (
      config &&
      Array.isArray(config.sections) &&
      Array.isArray(config.userMenuItems) &&
      Array.isArray(config.adminMenuItems)
    );
  }

  // Get sections that are currently implemented
  getImplementedSections(): NavigationSection[] {
    return this.config.sections.filter(section => section.isImplemented);
  }

  // Get sections that are not implemented
  getUnimplementedSections(): NavigationSection[] {
    return this.config.sections.filter(section => !section.isImplemented);
  }

  // Get sections with badges
  getSectionsWithBadges(): NavigationSection[] {
    return this.config.sections.filter(section => section.badge);
  }

  // Get configuration statistics
  getConfigStats() {
    const totalSections = this.config.sections.length;
    const implementedSections = this.getImplementedSections().length;
    const sectionsWithBadges = this.getSectionsWithBadges().length;
    
    const totalUserItems = this.config.userMenuItems.length;
    const implementedUserItems = this.config.userMenuItems.filter(item => item.isImplemented).length;
    
    const totalAdminItems = this.config.adminMenuItems.length;
    const implementedAdminItems = this.config.adminMenuItems.filter(item => item.isImplemented).length;

    return {
      sections: {
        total: totalSections,
        implemented: implementedSections,
        unimplemented: totalSections - implementedSections,
        withBadges: sectionsWithBadges,
        implementationRate: totalSections > 0 ? (implementedSections / totalSections) * 100 : 0
      },
      userMenuItems: {
        total: totalUserItems,
        implemented: implementedUserItems,
        unimplemented: totalUserItems - implementedUserItems,
        implementationRate: totalUserItems > 0 ? (implementedUserItems / totalUserItems) * 100 : 0
      },
      adminMenuItems: {
        total: totalAdminItems,
        implemented: implementedAdminItems,
        unimplemented: totalAdminItems - implementedAdminItems,
        implementationRate: totalAdminItems > 0 ? (implementedAdminItems / totalAdminItems) * 100 : 0
      }
    };
  }
}

// Create singleton instance
export const navigationConfigManager = new NavigationConfigManager();

// Convenience functions for common operations
export const toggleNavigationSection = (sectionId: string, isImplemented: boolean) =>
  navigationConfigManager.toggleSection(sectionId, isImplemented);

export const addNavigationBadge = (sectionId: string, text: string, variant: BadgeVariant) =>
  navigationConfigManager.addSectionBadge(sectionId, text, variant);

export const removeNavigationBadge = (sectionId: string) =>
  navigationConfigManager.removeSectionBadge(sectionId);

export const getNavigationConfig = () =>
  navigationConfigManager.getConfig();

export const subscribeToNavigationConfig = (listener: (config: NavigationConfig) => void) =>
  navigationConfigManager.subscribe(listener);