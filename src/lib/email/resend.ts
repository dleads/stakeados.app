import { Resend } from 'resend';
import { env } from '@/lib/env';

// Lazy initializer to avoid throwing at import-time when key is missing during build
let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!_resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error('Resend API key not configured');
    }
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

// Email configuration
export const EMAIL_CONFIG = {
  from: 'Stakeados <noreply@stakeados.com>',
  replyTo: 'support@stakeados.com',
  domain: env.NEXT_PUBLIC_APP_URL,
} as const;

// Email template types
export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

// Welcome email template
export function createWelcomeEmail(
  userEmail: string,
  displayName: string,
  locale: 'en' | 'es' = 'en'
): EmailTemplate {
  const isSpanish = locale === 'es';

  const subject = isSpanish
    ? '¡Bienvenido a Stakeados! 🚀'
    : 'Welcome to Stakeados! 🚀';

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
        .header { 
          text-align: center; 
          padding: 40px 0; 
          background: linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #0A0A0A 100%);
        }
        .logo { 
          font-size: 32px; 
          font-weight: bold; 
          color: #00FF88; 
          margin-bottom: 10px; 
        }
        .content { 
          background-color: #1A1A1A; 
          padding: 40px; 
          border-radius: 16px; 
          border: 1px solid #2A2A2A; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); 
          color: #0A0A0A; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          margin: 20px 0; 
        }
        .features { 
          margin: 30px 0; 
        }
        .feature { 
          margin: 15px 0; 
          padding: 15px; 
          background-color: #2A2A2A; 
          border-radius: 8px; 
          border-left: 4px solid #00FF88; 
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #7A7A7A; 
          font-size: 14px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚡ Stakeados</div>
          <p style="color: #BABABA; margin: 0;">
            ${isSpanish ? 'Plataforma Educativa Web3' : 'Web3 Educational Platform'}
          </p>
        </div>
        
        <div class="content">
          <h1 style="color: #00FF88; margin-bottom: 20px;">
            ${isSpanish ? `¡Hola ${displayName}!` : `Hello ${displayName}!`}
          </h1>
          
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 25px;">
            ${
              isSpanish
                ? 'Bienvenido a Stakeados, la plataforma educativa Web3 líder que combina educación blockchain con certificaciones NFT en la red Base.'
                : 'Welcome to Stakeados, the premier Web3 educational platform combining blockchain education with NFT certifications on Base network.'
            }
          </p>
          
          <div class="features">
            <div class="feature">
              <h3 style="color: #00FF88; margin: 0 0 10px 0;">🎓 ${isSpanish ? 'Contenido Educativo' : 'Educational Content'}</h3>
              <p style="margin: 0; color: #DADADA;">
                ${
                  isSpanish
                    ? 'Cursos completos sobre blockchain, criptomonedas y tecnologías Web3'
                    : 'Comprehensive courses on blockchain, cryptocurrency, and Web3 technologies'
                }
              </p>
            </div>
            
            <div class="feature">
              <h3 style="color: #00FF88; margin: 0 0 10px 0;">🏆 ${isSpanish ? 'Certificados NFT' : 'NFT Certificates'}</h3>
              <p style="margin: 0; color: #DADADA;">
                ${
                  isSpanish
                    ? 'Obtén certificados NFT verificables al completar cursos'
                    : 'Earn verifiable NFT certificates upon course completion'
                }
              </p>
            </div>
            
            <div class="feature">
              <h3 style="color: #00FF88; margin: 0 0 10px 0;">⭐ ${isSpanish ? 'Comunidad Genesis' : 'Genesis Community'}</h3>
              <p style="margin: 0; color: #DADADA;">
                ${
                  isSpanish
                    ? 'Únete a los miembros fundadores con beneficios exclusivos'
                    : 'Join founding members with exclusive benefits and early access'
                }
              </p>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${EMAIL_CONFIG.domain}/courses" class="button">
              ${isSpanish ? 'Comenzar a Aprender' : 'Start Learning'}
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #9A9A9A; font-size: 14px;">
            ${
              isSpanish
                ? 'Si tienes alguna pregunta, no dudes en contactarnos en support@stakeados.com'
                : 'If you have any questions, feel free to reach out to us at support@stakeados.com'
            }
          </p>
        </div>
        
        <div class="footer">
          <p>© 2025 Stakeados. ${isSpanish ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
          <p>
            <a href="${EMAIL_CONFIG.domain}/unsubscribe" style="color: #00FF88;">
              ${isSpanish ? 'Cancelar suscripción' : 'Unsubscribe'}
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = isSpanish
    ? `¡Hola ${displayName}!\n\nBienvenido a Stakeados, la plataforma educativa Web3 líder.\n\nComienza tu viaje de aprendizaje: ${EMAIL_CONFIG.domain}/courses\n\nSaludos,\nEl equipo de Stakeados`
    : `Hello ${displayName}!\n\nWelcome to Stakeados, the premier Web3 educational platform.\n\nStart your learning journey: ${EMAIL_CONFIG.domain}/courses\n\nBest regards,\nThe Stakeados Team`;

  return {
    to: userEmail,
    subject,
    html,
    text,
  };
}

// Course completion email template
export function createCourseCompletionEmail(
  userEmail: string,
  displayName: string,
  courseName: string,
  certificateUrl: string,
  locale: 'en' | 'es' = 'en'
): EmailTemplate {
  const isSpanish = locale === 'es';

  const subject = isSpanish
    ? `🎉 ¡Felicidades! Has completado ${courseName}`
    : `🎉 Congratulations! You completed ${courseName}`;

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
        .header { 
          text-align: center; 
          padding: 40px 0; 
          background: linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #0A0A0A 100%);
        }
        .content { 
          background-color: #1A1A1A; 
          padding: 40px; 
          border-radius: 16px; 
          border: 1px solid #2A2A2A; 
          text-align: center; 
        }
        .certificate-box { 
          background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); 
          padding: 30px; 
          border-radius: 12px; 
          margin: 30px 0; 
          color: #0A0A0A; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); 
          color: #0A0A0A; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          margin: 20px 10px; 
        }
        .button-secondary { 
          display: inline-block; 
          background: transparent; 
          color: #00FF88; 
          border: 2px solid #00FF88; 
          padding: 14px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          margin: 20px 10px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 32px; font-weight: bold; color: #00FF88; margin-bottom: 10px;">⚡ Stakeados</div>
        </div>
        
        <div class="content">
          <h1 style="color: #00FF88; font-size: 28px; margin-bottom: 20px;">
            🎉 ${isSpanish ? '¡Felicidades!' : 'Congratulations!'}
          </h1>
          
          <p style="font-size: 18px; margin-bottom: 25px;">
            ${isSpanish ? `¡Hola ${displayName}!` : `Hello ${displayName}!`}
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            ${
              isSpanish
                ? `Has completado exitosamente el curso <strong>${courseName}</strong>. ¡Tu certificado NFT ha sido acuñado en la red Base!`
                : `You have successfully completed the course <strong>${courseName}</strong>. Your NFT certificate has been minted on Base network!`
            }
          </p>
          
          <div class="certificate-box">
            <h3 style="margin: 0 0 15px 0; font-size: 24px;">🏆 ${isSpanish ? 'Certificado NFT' : 'NFT Certificate'}</h3>
            <p style="margin: 0; font-size: 16px;">
              ${
                isSpanish
                  ? 'Tu certificado verificable en blockchain está listo'
                  : 'Your blockchain-verified certificate is ready'
              }
            </p>
          </div>
          
          <div>
            <a href="${certificateUrl}" class="button">
              ${isSpanish ? 'Ver Certificado' : 'View Certificate'}
            </a>
            <a href="${EMAIL_CONFIG.domain}/courses" class="button-secondary">
              ${isSpanish ? 'Continuar Aprendiendo' : 'Continue Learning'}
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #9A9A9A; font-size: 14px;">
            ${
              isSpanish
                ? '¡Sigue aprendiendo y desbloqueando más logros!'
                : 'Keep learning and unlocking more achievements!'
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

// Achievement notification email template
export function createAchievementEmail(
  userEmail: string,
  displayName: string,
  achievementName: string,
  achievementDescription: string,
  locale: 'en' | 'es' = 'en'
): EmailTemplate {
  const isSpanish = locale === 'es';

  const subject = isSpanish
    ? `🏆 ¡Nuevo logro desbloqueado: ${achievementName}!`
    : `🏆 New achievement unlocked: ${achievementName}!`;

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
          text-align: center; 
        }
        .achievement-badge { 
          width: 80px; 
          height: 80px; 
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); 
          border-radius: 50%; 
          margin: 0 auto 20px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 32px; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); 
          color: #0A0A0A; 
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
          <div class="achievement-badge">🏆</div>
          
          <h1 style="color: #FFD700; font-size: 28px; margin-bottom: 20px;">
            ${isSpanish ? '¡Logro Desbloqueado!' : 'Achievement Unlocked!'}
          </h1>
          
          <p style="font-size: 18px; margin-bottom: 25px;">
            ${isSpanish ? `¡Hola ${displayName}!` : `Hello ${displayName}!`}
          </p>
          
          <h2 style="color: #00FF88; font-size: 24px; margin-bottom: 15px;">
            ${achievementName}
          </h2>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #DADADA;">
            ${achievementDescription}
          </p>
          
          <a href="${EMAIL_CONFIG.domain}/achievements" class="button">
            ${isSpanish ? 'Ver Todos los Logros' : 'View All Achievements'}
          </a>
          
          <p style="margin-top: 30px; color: #9A9A9A; font-size: 14px;">
            ${
              isSpanish
                ? '¡Sigue participando para desbloquear más logros!'
                : 'Keep participating to unlock more achievements!'
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

// Password reset email template
export function createPasswordResetEmail(
  userEmail: string,
  resetUrl: string,
  locale: 'en' | 'es' = 'en'
): EmailTemplate {
  const isSpanish = locale === 'es';

  const subject = isSpanish
    ? 'Restablecer tu contraseña de Stakeados'
    : 'Reset your Stakeados password';

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
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); 
          color: #0A0A0A; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          margin: 20px 0; 
        }
        .warning { 
          background-color: #FF6600; 
          color: #FFFFFF; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h1 style="color: #00FF88; margin-bottom: 20px;">
            ${isSpanish ? 'Restablecer Contraseña' : 'Reset Password'}
          </h1>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            ${
              isSpanish
                ? 'Recibimos una solicitud para restablecer la contraseña de tu cuenta de Stakeados.'
                : 'We received a request to reset the password for your Stakeados account.'
            }
          </p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">
              ${isSpanish ? 'Restablecer Contraseña' : 'Reset Password'}
            </a>
          </div>
          
          <div class="warning">
            <p style="margin: 0; font-size: 14px;">
              ${
                isSpanish
                  ? '⚠️ Este enlace expirará en 1 hora por seguridad.'
                  : '⚠️ This link will expire in 1 hour for security.'
              }
            </p>
          </div>
          
          <p style="color: #9A9A9A; font-size: 14px; margin-top: 30px;">
            ${
              isSpanish
                ? 'Si no solicitaste este restablecimiento, puedes ignorar este email de forma segura.'
                : 'If you did not request this reset, you can safely ignore this email.'
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

// Newsletter template
export function createNewsletterEmail(
  userEmail: string,
  displayName: string,
  content: {
    title: string;
    articles: Array<{ title: string; url: string; description: string }>;
    announcements: Array<{ title: string; description: string }>;
  },
  locale: 'en' | 'es' = 'en'
): EmailTemplate {
  const isSpanish = locale === 'es';

  const subject = isSpanish
    ? `📰 Stakeados Newsletter: ${content.title}`
    : `📰 Stakeados Newsletter: ${content.title}`;

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
        .article { 
          background-color: #2A2A2A; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #00FF88; 
        }
        .announcement { 
          background-color: #003366; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 15px 0; 
          border-left: 4px solid #00AAFF; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <h1 style="color: #00FF88; margin-bottom: 20px;">
            📰 ${content.title}
          </h1>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            ${isSpanish ? `¡Hola ${displayName}!` : `Hello ${displayName}!`}
          </p>
          
          ${
            content.announcements.length > 0
              ? `
            <h2 style="color: #00AAFF; margin-bottom: 20px;">
              ${isSpanish ? '📢 Anuncios' : '📢 Announcements'}
            </h2>
            ${content.announcements
              .map(
                announcement => `
              <div class="announcement">
                <h3 style="color: #00AAFF; margin: 0 0 10px 0;">${announcement.title}</h3>
                <p style="margin: 0; color: #DADADA;">${announcement.description}</p>
              </div>
            `
              )
              .join('')}
          `
              : ''
          }
          
          ${
            content.articles.length > 0
              ? `
            <h2 style="color: #00FF88; margin: 30px 0 20px 0;">
              ${isSpanish ? '📚 Artículos Destacados' : '📚 Featured Articles'}
            </h2>
            ${content.articles
              .map(
                article => `
              <div class="article">
                <h3 style="color: #00FF88; margin: 0 0 10px 0;">
                  <a href="${article.url}" style="color: #00FF88; text-decoration: none;">${article.title}</a>
                </h3>
                <p style="margin: 0; color: #DADADA;">${article.description}</p>
              </div>
            `
              )
              .join('')}
          `
              : ''
          }
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${EMAIL_CONFIG.domain}" style="display: inline-block; background: linear-gradient(135deg, #00FF88 0%, #00CC6A 100%); color: #0A0A0A; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              ${isSpanish ? 'Visitar Stakeados' : 'Visit Stakeados'}
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

// Send email function
export async function sendEmail(
  template: EmailTemplate
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.RESEND_API_KEY) {
      throw new Error('Resend API key not configured');
    }

    const { data, error } = await getResend().emails.send({
      from: template.from || EMAIL_CONFIG.from,
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: template.replyTo || EMAIL_CONFIG.replyTo,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Batch send emails
export async function sendBatchEmails(templates: EmailTemplate[]): Promise<{
  success: boolean;
  results: Array<{ success: boolean; error?: string }>;
}> {
  const results = await Promise.all(
    templates.map(template => sendEmail(template))
  );

  const successCount = results.filter(r => r.success).length;

  return {
    success: successCount === templates.length,
    results,
  };
}

// Check if Resend is configured
export function isResendConfigured(): boolean {
  return !!env.RESEND_API_KEY;
}

// Test email connection
export async function testEmailConnection(): Promise<boolean> {
  try {
    if (!isResendConfigured()) {
      return false;
    }

    // Send a test email to verify connection
    const testResult = await sendEmail({
      to: 'test@stakeados.com',
      subject: 'Stakeados Email Test',
      html: '<p>This is a test email from Stakeados.</p>',
      text: 'This is a test email from Stakeados.',
    });

    return testResult.success;
  } catch (error) {
    console.error('Email connection test failed:', error);
    return false;
  }
}
