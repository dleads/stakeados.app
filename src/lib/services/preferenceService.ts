// Server-safe proxy for preference service
// Route Handlers and Server Components must use the server implementation
export * from './notificationPreferencesService.server';
import { notificationPreferencesService as serverSingleton } from './notificationPreferencesService.server';

export const preferenceService = serverSingleton as unknown as Record<string, any>;
export default preferenceService;
