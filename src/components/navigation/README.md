# Navigation System

This directory contains the implementation of the navigation system for the Stakeados platform. The system provides a comprehensive navigation solution that integrates with Supabase authentication and supports role-based access control.

## Task 1 Implementation: Navigation Context and Provider

### Overview

Task 1 establishes the foundation of the navigation system by creating:

1. **NavigationContext** with TypeScript interfaces for navigation state
2. **NavigationProvider** component that integrates with existing Supabase auth
3. **Navigation configuration system** with `isImplemented` flags
4. **Custom hook `useNavigation`** for consuming navigation state

### Key Components

#### NavigationProvider

The main provider component that manages navigation state and integrates with authentication:

```tsx
import { NavigationProvider } from '@/components/navigation';

function App() {
  return (
    <NavigationProvider>
      {/* Your app components */}
    </NavigationProvider>
  );
}
```

#### useNavigation Hook

Primary hook for accessing navigation functionality:

```tsx
import { useNavigation } from '@/components/navigation';

function MyComponent() {
  const {
    isAuthenticated,
    userRole,
    currentPath,
    safeNavigate,
    getVisibleSections,
  } = useNavigation();
  
  // Use navigation state and methods
}
```

#### useNavigationState Hook

Convenience hook with pre-filtered navigation data:

```tsx
import { useNavigationState } from '@/hooks/useNavigationState';

function NavigationMenu() {
  const {
    visibleSections,
    userMenuItems,
    adminMenuItems,
  } = useNavigationState();
  
  // Render navigation items
}
```

### Configuration System

#### Navigation Configuration

The navigation system uses a centralized configuration approach:

```typescript
// src/lib/navigation/config.ts
export const defaultNavigationConfig: NavigationConfig = {
  sections: [
    {
      id: 'home',
      label: 'Inicio',
      href: '/',
      isImplemented: true
    },
    {
      id: 'articles',
      label: 'Artículos',
      href: '/articles',
      isImplemented: false, // Will be updated when implemented
      requiredAuth: false
    },
    {
      id: 'community',
      label: 'Comunidad',
      href: '/community',
      requiredAuth: true,
      isImplemented: false
    }
  ],
  userMenuItems: [
    {
      id: 'profile',
      label: 'Mi Perfil',
      href: '/profile',
      requiredAuth: true,
      isImplemented: false
    }
  ],
  adminMenuItems: [
    {
      id: 'admin-dashboard',
      label: 'Panel Admin',
      href: '/admin',
      requiredAuth: true,
      isImplemented: true
    }
  ]
};
```

#### Configuration Management

Helper functions for updating navigation configuration:

```typescript
import { 
  toggleNavigationSection,
  toggleUserMenuItem,
  toggleAdminMenuItem 
} from '@/lib/navigation/config';

// Enable a navigation section when it's implemented
const updatedConfig = toggleNavigationSection(config, 'articles', true);

// Enable a user menu item
const updatedConfig = toggleUserMenuItem(config, 'profile', true);
```

### Authentication Integration

The navigation system integrates seamlessly with the existing Supabase authentication:

```typescript
// Automatic integration with existing auth context
const { user, signOut } = useAuthContext();
const { role } = useRole();

// Navigation automatically filters based on:
// - Authentication state (user logged in/out)
// - User roles (admin, user, etc.)
// - Implementation status (isImplemented flag)
```

### Safe Navigation

The system includes safe navigation that prevents access to unimplemented features:

```typescript
const { safeNavigate } = useNavigation();

// This will show "Coming Soon" modal if section is not implemented
safeNavigate('/articles', articleSection);

// This will redirect to login if authentication is required
safeNavigate('/community', communitySection);

// This will show access denied if user lacks required role
safeNavigate('/admin', adminSection);
```

### TypeScript Support

Full TypeScript support with comprehensive interfaces:

```typescript
import type {
  NavigationSection,
  UserMenuItem,
  NavigationConfig,
  NavigationState,
  NavigationContextType,
} from '@/types/navigation';
```

### Testing

The navigation system includes comprehensive tests:

```bash
# Run navigation tests
npm run test -- src/components/navigation/__tests__/NavigationProvider.test.tsx
```

### Usage Examples

#### Basic Navigation Menu

```tsx
import { useNavigationState } from '@/hooks/useNavigationState';

function NavigationMenu() {
  const { visibleSections, safeNavigate } = useNavigationState();
  
  return (
    <nav>
      {visibleSections.map(section => (
        <button
          key={section.id}
          onClick={() => safeNavigate(section.href, section)}
          disabled={!section.isImplemented}
        >
          {section.label}
          {!section.isImplemented && ' (Coming Soon)'}
        </button>
      ))}
    </nav>
  );
}
```

#### User Menu

```tsx
import { useNavigationState } from '@/hooks/useNavigationState';

function UserMenu() {
  const { userMenuItems, adminMenuItems, isAuthenticated } = useNavigationState();
  
  if (!isAuthenticated) return null;
  
  return (
    <div>
      {userMenuItems.map(item => (
        <MenuItem key={item.id} item={item} />
      ))}
      {adminMenuItems.map(item => (
        <MenuItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

#### Access Control Check

```tsx
import { useNavigationAccess } from '@/hooks/useNavigationState';

function ProtectedComponent() {
  const { isAccessible, reason } = useNavigationAccess('admin-dashboard');
  
  if (!isAccessible) {
    return <div>Access denied: {reason}</div>;
  }
  
  return <AdminDashboard />;
}
```

### Implementation Status

✅ **Completed in Task 1:**
- NavigationContext with TypeScript interfaces
- NavigationProvider with Supabase auth integration
- Navigation configuration system with isImplemented flags
- useNavigation custom hook
- Safe navigation with access control
- Comprehensive TypeScript types
- Unit tests
- Documentation and examples

### Next Steps

The following tasks will build upon this foundation:
- Task 2: Core Navigation Components Structure
- Task 3: Authentication-Based Navigation Logic
- Task 4: Mobile Navigation System
- Task 5: Active Link Highlighting
- And more...

### Files Structure

```
src/components/navigation/
├── NavigationProvider.tsx          # Main provider component
├── index.ts                        # Exports
├── examples/
│   └── NavigationExample.tsx       # Usage examples
├── __tests__/
│   └── NavigationProvider.test.tsx # Tests
└── README.md                       # This file

src/types/
└── navigation.ts                   # TypeScript interfaces

src/lib/navigation/
└── config.ts                       # Navigation configuration

src/hooks/
└── useNavigationState.ts           # Navigation hooks
```

This implementation provides a solid foundation for the navigation system that can be extended with additional features in subsequent tasks.