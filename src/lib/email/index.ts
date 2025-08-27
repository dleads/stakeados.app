// Main email exports
export {
  resend,
  sendEmail,
  sendBatchEmails,
  isResendConfigured,
  testEmailConnection,
  EMAIL_CONFIG,
} from './resend';

export { EmailTemplateFactory, EmailQueue, emailQueue } from './templates';

export type { EmailTemplate } from './resend';

// Email service functions
export * from './services';
