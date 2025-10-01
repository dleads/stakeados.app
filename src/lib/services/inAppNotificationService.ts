// Server-safe shim for in-app notifications
// Use the server version of notification service to avoid browser client on server
export * from './notificationService.server';
import { notificationServiceServer } from './notificationService.server';

// Named export expected by some routes
export const inAppNotificationService = notificationServiceServer;
export default inAppNotificationService;
