'use client';

import React from 'react';
import { Users, Edit3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useArticleCollaboration } from '@/hooks/useArticleCollaboration';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CollaborationIndicatorProps {
  articleId: string;
  className?: string;
}

export function CollaborationIndicator({
  articleId,
  className,
}: CollaborationIndicatorProps) {
  const { activeCollaborators, isCollaborating, contentChanges } =
    useArticleCollaboration(articleId);

  if (!isCollaborating && activeCollaborators.length === 0) {
    return null;
  }

  const recentChanges = contentChanges.slice(-5); // Last 5 changes

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Active Collaborators */}
        {activeCollaborators.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {activeCollaborators.slice(0, 3).map(collaborator => (
                <Tooltip key={collaborator.userId}>
                  <TooltipTrigger>
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={collaborator.userAvatar} />
                      <AvatarFallback className="text-xs">
                        {collaborator.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">{collaborator.userName}</p>
                      <p className="text-muted-foreground">
                        Activo{' '}
                        {formatDistanceToNow(collaborator.lastActivity, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                      {collaborator.cursorPosition && (
                        <p className="text-xs text-muted-foreground">
                          Línea {collaborator.cursorPosition.line}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}

              {activeCollaborators.length > 3 && (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                      +{activeCollaborators.length - 3}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">Otros colaboradores:</p>
                      {activeCollaborators.slice(3).map(collaborator => (
                        <p
                          key={collaborator.userId}
                          className="text-muted-foreground"
                        >
                          {collaborator.userName}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {activeCollaborators.length} colaborando
            </Badge>
          </div>
        )}

        {/* Collaboration Status */}
        {isCollaborating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">En vivo</span>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentChanges.length > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs">
                <Edit3 className="h-3 w-3 mr-1" />
                {recentChanges.length} cambios recientes
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm max-w-xs">
                <p className="font-medium mb-2">Actividad reciente:</p>
                <div className="space-y-1">
                  {recentChanges.map((change, index) => (
                    <div key={index} className="text-xs">
                      <span className="font-medium">{change.userName}</span>
                      <span className="text-muted-foreground ml-1">
                        {formatDistanceToNow(new Date(change.timestamp), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Cursor indicator for showing other users' cursors in the editor
export function CollaboratorCursor({
  collaborator,
  position,
}: {
  collaborator: any;
  position: { top: number; left: number };
}) {
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-1">
        <div
          className="w-0.5 h-5 bg-blue-500 animate-pulse"
          style={{ backgroundColor: collaborator.color || '#3b82f6' }}
        />
        <div
          className="px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap"
          style={{ backgroundColor: collaborator.color || '#3b82f6' }}
        >
          {collaborator.userName}
        </div>
      </div>
    </div>
  );
}

// Selection indicator for showing other users' text selections
export function CollaboratorSelection({
  collaborator,
  range,
}: {
  collaborator: any;
  range: { start: number; end: number };
}) {
  return (
    <div
      className="absolute pointer-events-none bg-opacity-20 rounded"
      style={{
        backgroundColor: collaborator.color || '#3b82f6',
        left: range.start,
        width: range.end - range.start,
      }}
    />
  );
}
