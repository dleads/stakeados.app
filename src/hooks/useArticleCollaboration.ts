'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import {
  realTimeService,
  CollaborationEvent,
} from '@/lib/services/realTimeService';
import { debounce } from 'lodash';

export interface CollaboratorInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
  cursorPosition?: { line: number; column: number };
  selectionRange?: { start: number; end: number };
  lastActivity: Date;
  isActive: boolean;
}

export interface CollaborationState {
  collaborators: Map<string, CollaboratorInfo>;
  isCollaborating: boolean;
  sessionId?: string;
}

export function useArticleCollaboration(articleId: string) {
  const { user, profile } = useUser();
  const [collaborationState, setCollaborationState] =
    useState<CollaborationState>({
      collaborators: new Map(),
      isCollaborating: false,
    });
  const [contentChanges, setContentChanges] = useState<any[]>([]);
  const sessionIdRef = useRef<string>();
  const lastActivityRef = useRef<Date>(new Date());

  // Start collaboration session
  const startSession = useCallback(async () => {
    if (!user?.id || !articleId) return;

    try {
      const response = await fetch('/api/admin/articles/collaboration/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionIdRef.current = data.sessionId;
        setCollaborationState(prev => ({
          ...prev,
          isCollaborating: true,
          sessionId: data.sessionId,
        }));

        // Announce user joined
        realTimeService.sendCollaborationEvent(articleId, {
          type: 'user_joined',
          userId: user.id,
          userName: profile?.display_name || user?.email || 'Unknown User',
          articleId,
        });
      }
    } catch (error) {
      console.error('Error starting collaboration session:', error);
    }
  }, [user, articleId]);

  // End collaboration session
  const endSession = useCallback(async () => {
    if (!user?.id || !sessionIdRef.current) return;

    try {
      await fetch('/api/admin/articles/collaboration/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      });

      // Announce user left
      realTimeService.sendCollaborationEvent(articleId, {
        type: 'user_left',
        userId: user.id,
        userName: profile?.display_name || user?.email || 'Unknown User',
        articleId,
      });

      setCollaborationState(prev => ({
        ...prev,
        isCollaborating: false,
        sessionId: undefined,
        collaborators: new Map(),
      }));
      sessionIdRef.current = undefined;
    } catch (error) {
      console.error('Error ending collaboration session:', error);
    }
  }, [user, articleId]);

  // Send cursor position update
  const updateCursorPosition = useCallback(
    debounce((position: { line: number; column: number }) => {
      if (!user?.id || !collaborationState.isCollaborating) return;

      realTimeService.sendCollaborationEvent(articleId, {
        type: 'cursor_moved',
        userId: user.id,
        userName: profile?.display_name || user?.email || 'Unknown User',
        articleId,
        data: { cursorPosition: position },
      });

      lastActivityRef.current = new Date();
    }, 100),
    [user, articleId, collaborationState.isCollaborating]
  );

  // Send selection change update
  const updateSelection = useCallback(
    debounce((selection: { start: number; end: number }) => {
      if (!user?.id || !collaborationState.isCollaborating) return;

      realTimeService.sendCollaborationEvent(articleId, {
        type: 'selection_changed',
        userId: user.id,
        userName: profile?.display_name || user?.email || 'Unknown User',
        articleId,
        data: { selectionRange: selection },
      });

      lastActivityRef.current = new Date();
    }, 200),
    [user, articleId, collaborationState.isCollaborating]
  );

  // Send content change
  const sendContentChange = useCallback(
    debounce((change: any) => {
      if (!user?.id || !collaborationState.isCollaborating) return;

      const changeEvent = {
        type: 'content_changed' as const,
        userId: user.id,
        userName: profile?.display_name || user?.email || 'Unknown User',
        articleId,
        data: {
          change,
          timestamp: new Date().toISOString(),
        },
      };

      realTimeService.sendCollaborationEvent(articleId, changeEvent);
      setContentChanges(prev => [...prev, changeEvent].slice(-50)); // Keep last 50 changes

      lastActivityRef.current = new Date();
    }, 300),
    [user, articleId, collaborationState.isCollaborating]
  );

  // Handle collaboration events
  const handleCollaborationEvent = useCallback(
    (event: CollaborationEvent) => {
      // Don't process our own events
      if (event.userId === user?.id) return;

      setCollaborationState(prev => {
        const newCollaborators = new Map(prev.collaborators);

        switch (event.type) {
          case 'user_joined':
            newCollaborators.set(event.userId, {
              userId: event.userId,
              userName: event.userName,
              lastActivity: event.timestamp,
              isActive: true,
            });
            break;

          case 'user_left':
            newCollaborators.delete(event.userId);
            break;

          case 'cursor_moved':
            if (newCollaborators.has(event.userId)) {
              const collaborator = newCollaborators.get(event.userId)!;
              newCollaborators.set(event.userId, {
                ...collaborator,
                cursorPosition: event.data?.cursorPosition,
                lastActivity: event.timestamp,
                isActive: true,
              });
            }
            break;

          case 'selection_changed':
            if (newCollaborators.has(event.userId)) {
              const collaborator = newCollaborators.get(event.userId)!;
              newCollaborators.set(event.userId, {
                ...collaborator,
                selectionRange: event.data?.selectionRange,
                lastActivity: event.timestamp,
                isActive: true,
              });
            }
            break;

          case 'content_changed':
            // Handle remote content changes
            setContentChanges(prev => [...prev, event].slice(-50));
            break;
        }

        return {
          ...prev,
          collaborators: newCollaborators,
        };
      });
    },
    [user?.id]
  );

  // Load active collaborators
  const loadActiveCollaborators = useCallback(async () => {
    if (!articleId) return;

    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}/collaborators`
      );
      if (response.ok) {
        const data = await response.json();
        const collaboratorsMap = new Map();

        data.collaborators?.forEach((collab: any) => {
          if (collab.userId !== user?.id) {
            collaboratorsMap.set(collab.userId, {
              userId: collab.userId,
              userName: collab.userName,
              userAvatar: collab.userAvatar,
              lastActivity: new Date(collab.lastActivity),
              isActive: collab.isActive,
            });
          }
        });

        setCollaborationState(prev => ({
          ...prev,
          collaborators: collaboratorsMap,
        }));
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  }, [articleId, user?.id]);

  // Cleanup inactive collaborators
  const cleanupInactiveCollaborators = useCallback(() => {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    setCollaborationState(prev => {
      const newCollaborators = new Map(prev.collaborators);

      for (const [userId, collaborator] of newCollaborators) {
        if (
          now.getTime() - collaborator.lastActivity.getTime() >
          inactiveThreshold
        ) {
          newCollaborators.delete(userId);
        }
      }

      return {
        ...prev,
        collaborators: newCollaborators,
      };
    });
  }, []);

  // Setup real-time subscription and session management
  useEffect(() => {
    if (!articleId || !user?.id) return;

    loadActiveCollaborators();

    const unsubscribe = realTimeService.subscribeToArticleCollaboration(
      articleId,
      handleCollaborationEvent
    );

    // Cleanup interval for inactive collaborators
    const cleanupInterval = setInterval(cleanupInactiveCollaborators, 60000); // Every minute

    // Activity heartbeat
    const heartbeatInterval = setInterval(() => {
      if (collaborationState.isCollaborating) {
        const now = new Date();
        if (now.getTime() - lastActivityRef.current.getTime() < 30000) {
          // Active in last 30 seconds
          realTimeService.sendCollaborationEvent(articleId, {
            type: 'cursor_moved',
            userId: user.id,
            userName: profile?.display_name || user?.email || 'Unknown User',
            articleId,
            data: { heartbeat: true },
          });
        }
      }
    }, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
      clearInterval(heartbeatInterval);
    };
  }, [
    articleId,
    user?.id,
    handleCollaborationEvent,
    loadActiveCollaborators,
    cleanupInactiveCollaborators,
    collaborationState.isCollaborating,
  ]);

  // Auto-start session when component mounts
  useEffect(() => {
    if (articleId && user?.id && !collaborationState.isCollaborating) {
      startSession();
    }

    // End session when component unmounts
    return () => {
      if (collaborationState.isCollaborating) {
        endSession();
      }
    };
  }, [articleId, user?.id]);

  return {
    collaborationState,
    contentChanges,
    startSession,
    endSession,
    updateCursorPosition,
    updateSelection,
    sendContentChange,
    activeCollaborators: Array.from(collaborationState.collaborators.values()),
    isCollaborating: collaborationState.isCollaborating,
  };
}
