/**
 * Navigation accessibility utilities and constants
 * Implements WCAG 2.1 AA standards for keyboard navigation and screen reader support
 */

import type { NavigationSection, UserMenuItem } from '@/types/navigation';

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  TAB: 'Tab',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

// ARIA roles and properties
export const ARIA_ROLES = {
  NAVIGATION: 'navigation',
  MENUBAR: 'menubar',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  BUTTON: 'button',
  DIALOG: 'dialog',
  BANNER: 'banner',
} as const;

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
      .filter(el => this.isVisible(el)) as HTMLElement[];
  }

  /**
   * Check if an element is visible and focusable
   */
  static isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      (element as HTMLElement).offsetParent !== null
    );
  }

  /**
   * Trap focus within a container (for modals/menus)
   */
  static trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === KEYBOARD_KEYS.TAB) {
      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  /**
   * Focus the first focusable element in a container
   */
  static focusFirst(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * Focus the last focusable element in a container
   */
  static focusLast(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }

  /**
   * Store and restore focus for modal interactions
   */
  static storeFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  }

  static restoreFocus(element: HTMLElement | null): void {
    if (element && this.isVisible(element)) {
      element.focus();
    }
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  /**
   * Generate accessible label for navigation section
   */
  static getNavigationSectionLabel(section: NavigationSection, isActive: boolean): string {
    let label = section.label;
    
    if (isActive) {
      label += ', página actual';
    }
    
    if (!section.isImplemented) {
      label += ', funcionalidad próximamente disponible';
    }
    
    if (section.requiredAuth) {
      label += ', requiere iniciar sesión';
    }
    
    if (section.badge) {
      label += `, ${section.badge.text}`;
    }
    
    return label;
  }

  /**
   * Generate accessible description for navigation section
   */
  static getNavigationSectionDescription(section: NavigationSection): string {
    const descriptions: Record<string, string> = {
      home: 'Página principal de Stakeados',
      articles: 'Contenido educativo sobre staking y blockchain',
      news: 'Últimas noticias y actualizaciones del ecosistema',
      community: 'Únete a las discusiones y conecta con otros usuarios',
      courses: 'Plataforma de aprendizaje interactivo',
      admin: 'Panel de administración del sistema',
    };
    
    return descriptions[section.id] || 'Funcionalidad de la plataforma';
  }

  /**
   * Generate accessible label for user menu item
   */
  static getUserMenuItemLabel(item: UserMenuItem): string {
    let label = item.label;
    
    if (!item.isImplemented && item.action !== 'logout') {
      label += ', funcionalidad próximamente disponible';
    }
    
    if (item.action === 'logout') {
      label += ', cerrar sesión';
    }
    
    return label;
  }

  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
}

// Keyboard navigation handlers
export class KeyboardNavigationHandler {
  /**
   * Handle keyboard navigation for horizontal menu (desktop)
   */
  static handleHorizontalMenuNavigation(
    event: KeyboardEvent,
    container: HTMLElement,
    onEscape?: () => void
  ): void {
    const focusableElements = FocusManager.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_LEFT:
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        focusableElements[prevIndex]?.focus();
        break;
        
      case KEYBOARD_KEYS.ARROW_RIGHT:
        event.preventDefault();
        const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        focusableElements[nextIndex]?.focus();
        break;
        
      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        focusableElements[0]?.focus();
        break;
        
      case KEYBOARD_KEYS.END:
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
        break;
        
      case KEYBOARD_KEYS.ESCAPE:
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
    }
  }

  /**
   * Handle keyboard navigation for vertical menu (mobile)
   */
  static handleVerticalMenuNavigation(
    event: KeyboardEvent,
    container: HTMLElement,
    onEscape?: () => void
  ): void {
    const focusableElements = FocusManager.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        focusableElements[prevIndex]?.focus();
        break;
        
      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault();
        const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        focusableElements[nextIndex]?.focus();
        break;
        
      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        focusableElements[0]?.focus();
        break;
        
      case KEYBOARD_KEYS.END:
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
        break;
        
      case KEYBOARD_KEYS.ESCAPE:
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
    }
  }

  /**
   * Handle activation keys (Enter/Space) for interactive elements
   */
  static handleActivation(
    event: KeyboardEvent,
    callback: () => void
  ): void {
    if (event.key === KEYBOARD_KEYS.ENTER || event.key === KEYBOARD_KEYS.SPACE) {
      event.preventDefault();
      callback();
    }
  }
}

// Accessibility validation utilities
export class AccessibilityValidator {
  /**
   * Validate that an element has proper ARIA attributes
   */
  static validateAriaAttributes(element: HTMLElement): string[] {
    const issues: string[] = [];
    
    // Check for missing aria-label or aria-labelledby on interactive elements
    if (this.isInteractiveElement(element)) {
      const hasLabel = element.hasAttribute('aria-label') || 
                     element.hasAttribute('aria-labelledby') ||
                     element.textContent?.trim();
      
      if (!hasLabel) {
        issues.push('Interactive element missing accessible label');
      }
    }
    
    // Check for proper role attributes
    const role = element.getAttribute('role');
    if (role && !this.isValidRole(role)) {
      issues.push(`Invalid ARIA role: ${role}`);
    }
    
    return issues;
  }

  private static isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    const hasTabIndex = element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1';
    const hasClickHandler = element.onclick !== null;
    
    return interactiveTags.includes(element.tagName.toLowerCase()) || hasTabIndex || hasClickHandler;
  }

  private static isValidRole(role: string): boolean {
    const validRoles = Object.values(ARIA_ROLES);
    return validRoles.includes(role as any);
  }
}

// Export utility functions for common accessibility patterns
export const a11yUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create ARIA live region for announcements
  createLiveRegion: (priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    return region;
  },

  // Check if reduced motion is preferred
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get appropriate focus outline styles
  getFocusStyles: (): string => {
    return 'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
  },
};