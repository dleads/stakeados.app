// Help System Components Export
export { default as HelpSystem } from './HelpSystem';
export { default as Tooltip, FieldTooltip, AdminTooltips } from './Tooltip';
export { default as ContextualHelp, useContextualHelp } from './ContextualHelp';

// Types
export interface HelpSystemProps {
  className?: string;
}

export interface TooltipProps {
  content: string;
  type?: 'info' | 'help' | 'warning';
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
}

export interface ContextualHelpProps {
  page: string;
  section?: string;
  className?: string;
}

// Help Content Types
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  lastUpdated: string;
  rating: number;
  videoUrl?: string;
}

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl: string;
  videoUrl: string;
  category: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}
