'use client';

import { useState, useCallback } from 'react';

interface ComingSoonState {
  isOpen: boolean;
  featureName: string;
  description?: string;
  estimatedDate?: string;
}

export function useComingSoon() {
  const [state, setState] = useState<ComingSoonState>({
    isOpen: false,
    featureName: '',
    description: undefined,
    estimatedDate: undefined,
  });

  const showComingSoonModal = useCallback((
    featureName: string,
    description?: string,
    estimatedDate?: string
  ) => {
    setState({
      isOpen: true,
      featureName,
      description,
      estimatedDate,
    });
  }, []);

  const hideComingSoonModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const showComingSoonForSection = useCallback((sectionId: string) => {
    // Predefined coming soon information for different sections
    const comingSoonInfo: Record<string, { name: string; description?: string; estimated?: string }> = {
      'articles': {
        name: 'Sistema de Artículos',
        description: 'Estamos desarrollando un completo sistema de gestión de artículos con categorías, búsqueda avanzada y comentarios.',
        estimated: 'Q2 2024'
      },
      'news': {
        name: 'Sistema de Noticias',
        description: 'Estamos creando un sistema de noticias en tiempo real con notificaciones y categorización automática.',
        estimated: 'Q2 2024'
      },
      'community': {
        name: 'Comunidad',
        description: 'Estamos construyendo un espacio de comunidad con foros, chat en tiempo real y eventos virtuales.',
        estimated: 'Q3 2024'
      },
      'courses': {
        name: 'Sistema de Cursos',
        description: 'Estamos desarrollando una plataforma completa de cursos con videos, ejercicios interactivos y certificaciones.',
        estimated: 'Q4 2024'
      },
      'profile': {
        name: 'Perfil de Usuario',
        description: 'Estamos creando un sistema completo de perfiles con estadísticas, logros y configuración personalizada.',
        estimated: 'Q2 2024'
      },
      'settings': {
        name: 'Configuración',
        description: 'Estamos desarrollando un panel de configuración completo con preferencias de notificaciones, privacidad y personalización.',
        estimated: 'Q2 2024'
      },
      'admin-users': {
        name: 'Gestión de Usuarios',
        description: 'Estamos creando herramientas avanzadas para la gestión y administración de usuarios.',
        estimated: 'Q3 2024'
      },
      'admin-content': {
        name: 'Gestión de Contenido',
        description: 'Estamos desarrollando un CMS completo para la gestión de contenido de la plataforma.',
        estimated: 'Q3 2024'
      },
      'admin-analytics': {
        name: 'Analytics',
        description: 'Estamos implementando un sistema completo de analytics y métricas para administradores.',
        estimated: 'Q4 2024'
      },
      'admin-settings': {
        name: 'Configuración del Sistema',
        description: 'Estamos creando herramientas para la configuración avanzada del sistema.',
        estimated: 'Q4 2024'
      }
    };

    const info = comingSoonInfo[sectionId];
    if (info) {
      showComingSoonModal(info.name, info.description, info.estimated);
    } else {
      showComingSoonModal('Esta funcionalidad', 'Esta funcionalidad está en desarrollo y estará disponible pronto.');
    }
  }, [showComingSoonModal]);

  return {
    isComingSoonOpen: state.isOpen,
    comingSoonFeatureName: state.featureName,
    comingSoonDescription: state.description,
    comingSoonEstimatedDate: state.estimatedDate,
    showComingSoonModal,
    hideComingSoonModal,
    showComingSoonForSection,
  };
}