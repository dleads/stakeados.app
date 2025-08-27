// Email template utilities and additional templates

import {
  createWelcomeEmail,
  createCourseCompletionEmail,
  createAchievementEmail,
  createPasswordResetEmail,
  createNewsletterEmail,
  sendEmail,
} from './resend';
import type { EmailTemplate } from './resend';
import type { Locale } from '@/types';

// Email template factory
export class EmailTemplateFactory {
  static welcome(
    userEmail: string,
    displayName: string,
    locale: Locale = 'en'
  ) {
    return createWelcomeEmail(userEmail, displayName, locale);
  }

  static courseCompletion(
    userEmail: string,
    displayName: string,
    courseName: string,
    certificateUrl: string,
    locale: Locale = 'en'
  ) {
    return createCourseCompletionEmail(
      userEmail,
      displayName,
      courseName,
      certificateUrl,
      locale
    );
  }

  static achievement(
    userEmail: string,
    displayName: string,
    achievementName: string,
    achievementDescription: string,
    locale: Locale = 'en'
  ) {
    return createAchievementEmail(
      userEmail,
      displayName,
      achievementName,
      achievementDescription,
      locale
    );
  }

  static passwordReset(
    userEmail: string,
    resetUrl: string,
    locale: Locale = 'en'
  ) {
    return createPasswordResetEmail(userEmail, resetUrl, locale);
  }

  static newsletter(
    userEmail: string,
    displayName: string,
    content: any,
    locale: Locale = 'en'
  ) {
    return createNewsletterEmail(userEmail, displayName, content, locale);
  }

  // Genesis invitation email
  static genesisInvitation(
    userEmail: string,
    displayName: string,
    inviteCode: string,
    locale: Locale = 'en'
  ) {
    const isSpanish = locale === 'es';

    const subject = isSpanish
      ? '👑 Invitación Exclusiva: Únete a la Comunidad Genesis'
      : '👑 Exclusive Invitation: Join the Genesis Community';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            background-color: #0A0A0A; 
            color: #FFFFFF; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .content { 
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); 
            padding: 40px; 
            border-radius: 16px; 
            color: #0A0A0A; 
            text-align: center; 
          }
          .invite-code { 
            background-color: #0A0A0A; 
            color: #FFD700; 
            padding: 20px; 
            border-radius: 8px; 
            font-family: monospace; 
            font-size: 24px; 
            font-weight: bold; 
            margin: 20px 0; 
            letter-spacing: 2px; 
          }
          .button { 
            display: inline-block; 
            background-color: #0A0A0A; 
            color: #FFD700; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 20px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 style="margin-bottom: 20px; font-size: 32px;">
              👑 ${isSpanish ? 'Invitación Genesis' : 'Genesis Invitation'}
            </h1>
            
            <p style="font-size: 18px; margin-bottom: 25px;">
              ${isSpanish ? `¡Hola ${displayName}!` : `Hello ${displayName}!`}
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              ${
                isSpanish
                  ? 'Has sido seleccionado para unirte a la exclusiva Comunidad Genesis de Stakeados. Como miembro fundador, tendrás acceso a beneficios únicos y privilegios especiales.'
                  : 'You have been selected to join the exclusive Stakeados Genesis Community. As a founding member, you will have access to unique benefits and special privileges.'
              }
            </p>
            
            <div class="invite-code">
              ${inviteCode}
            </div>
            
            <p style="font-size: 14px; margin-bottom: 30px;">
              ${isSpanish ? 'Código de invitación exclusivo' : 'Exclusive invitation code'}
            </p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/genesis/claim?code=${inviteCode}" class="button">
              ${isSpanish ? 'Reclamar Estatus Genesis' : 'Claim Genesis Status'}
            </a>
            
            <p style="font-size: 14px; margin-top: 30px;">
              ${
                isSpanish
                  ? 'Esta invitación es limitada y expira en 7 días.'
                  : 'This invitation is limited and expires in 7 days.'
              }
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      to: userEmail,
      subject,
      html,
    };
  }

  // Weekly digest email
  static weeklyDigest(
    userEmail: string,
    displayName: string,
    data: {
      coursesCompleted: number;
      pointsEarned: number;
      newAchievements: string[];
      recommendedCourses: Array<{ title: string; url: string }>;
    },
    locale: Locale = 'en'
  ) {
    const isSpanish = locale === 'es';

    const subject = isSpanish
      ? '📊 Tu resumen semanal de Stakeados'
      : '📊 Your Stakeados weekly digest';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            background-color: #0A0A0A; 
            color: #FFFFFF; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .content { 
            background-color: #1A1A1A; 
            padding: 40px; 
            border-radius: 16px; 
            border: 1px solid #2A2A2A; 
          }
          .stat-box { 
            background-color: #2A2A2A; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 10px; 
            flex: 1; 
          }
          .stats-row { 
            display: flex; 
            gap: 10px; 
            margin: 20px 0; 
          }
          .achievement { 
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); 
            color: #0A0A0A; 
            padding: 10px 15px; 
            border-radius: 20px; 
            display: inline-block; 
            margin: 5px; 
            font-size: 14px; 
            font-weight: 600; 
          }
          .course-rec { 
            background-color: #2A2A2A; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 10px 0; 
            border-left: 4px solid #00FF88; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 style="color: #00FF88; margin-bottom: 20px;">
              📊 ${isSpanish ? 'Resumen Semanal' : 'Weekly Digest'}
            </h1>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              ${isSpanish ? `¡Hola ${displayName}!` : `Hello ${displayName}!`}
            </p>
            
            <p style="margin-bottom: 30px;">
              ${
                isSpanish
                  ? 'Aquí tienes un resumen de tu actividad esta semana:'
                  : "Here's a summary of your activity this week:"
              }
            </p>
            
            <div class="stats-row">
              <div class="stat-box">
                <div style="font-size: 32px; color: #00FF88; font-weight: bold;">${data.coursesCompleted}</div>
                <div style="color: #DADADA;">${isSpanish ? 'Cursos Completados' : 'Courses Completed'}</div>
              </div>
              <div class="stat-box">
                <div style="font-size: 32px; color: #FFD700; font-weight: bold;">${data.pointsEarned}</div>
                <div style="color: #DADADA;">${isSpanish ? 'Puntos Ganados' : 'Points Earned'}</div>
              </div>
            </div>
            
            ${
              data.newAchievements.length > 0
                ? `
              <h3 style="color: #FFD700; margin: 30px 0 15px 0;">
                🏆 ${isSpanish ? 'Nuevos Logros' : 'New Achievements'}
              </h3>
              <div>
                ${data.newAchievements
                  .map(
                    achievement => `
                  <span class="achievement">${achievement}</span>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }
            
            ${
              data.recommendedCourses.length > 0
                ? `
              <h3 style="color: #00FF88; margin: 30px 0 15px 0;">
                📚 ${isSpanish ? 'Cursos Recomendados' : 'Recommended Courses'}
              </h3>
              ${data.recommendedCourses
                .map(
                  course => `
                <div class="course-rec">
                  <a href="${course.url}" style="color: #00FF88; text-decoration: none; font-weight: 600;">
                    ${course.title}
                  </a>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                ${isSpanish ? 'Ver Dashboard' : 'View Dashboard'}
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      to: userEmail,
      subject,
      html,
    };
  }
}

// Email queue for batch processing
export class EmailQueue {
  private queue: EmailTemplate[] = [];
  private processing = false;

  add(template: EmailTemplate) {
    this.queue.push(template);
  }

  addBatch(templates: EmailTemplate[]) {
    this.queue.push(...templates);
  }

  async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      // Process emails in batches of 10 to respect rate limits
      const batchSize = 10;
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, batchSize);

        const results = await Promise.allSettled(
          batch.map(template => sendEmail(template))
        );

        // Log results
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            console.log(`Email sent successfully to ${batch[index].to}`);
          } else {
            console.error(
              `Failed to send email to ${batch[index].to}:`,
              result.status === 'fulfilled' ? result.value.error : result.reason
            );
          }
        });

        // Add delay between batches to respect rate limits
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      this.processing = false;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
}

// Global email queue instance
export const emailQueue = new EmailQueue();

// Auto-process queue every 30 seconds
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    emailQueue.process();
  }, 30000);
}
