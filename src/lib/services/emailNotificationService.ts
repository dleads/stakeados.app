import { EmailService } from '@/lib/services/emailService';
import { createClient } from '@/lib/supabase/server';
import { notificationPreferencesService } from '@/lib/services/notificationPreferencesService.server';
import type {
  EmailTemplate,
  EmailNotificationData,
  DigestEmailData,
} from '@/types/notifications';

export class EmailNotificationService {
  private templates: Record<string, EmailTemplate> = {
    new_article: {
      subject: {
        en: 'New Article: {title}',
        es: 'Nuevo Artículo: {title}',
      },
      html: {
        en: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FF88;">New Article Published</h2>
            <h3>{title}</h3>
            <p>{message}</p>
            <a href="{articleUrl}" style="background-color: #00FF88; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              Read Article
            </a>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              You received this notification because you're subscribed to updates from Stakeados.
              <a href="{unsubscribeUrl}">Unsubscribe</a> | 
              <a href="{preferencesUrl}">Manage Preferences</a>
            </p>
          </div>
        `,
        es: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FF88;">Nuevo Artículo Publicado</h2>
            <h3>{title}</h3>
            <p>{message}</p>
            <a href="{articleUrl}" style="background-color: #00FF88; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              Leer Artículo
            </a>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Recibiste esta notificación porque estás suscrito a actualizaciones de Stakeados.
              <a href="{unsubscribeUrl}">Cancelar suscripción</a> | 
              <a href="{preferencesUrl}">Gestionar Preferencias</a>
            </p>
          </div>
        `,
      },
      text: {
        en: `
          New Article Published: {title}
          
          {message}
          
          Read the full article: {articleUrl}
          
          ---
          You received this notification because you're subscribed to updates from Stakeados.
          Unsubscribe: {unsubscribeUrl}
          Manage Preferences: {preferencesUrl}
        `,
        es: `
          Nuevo Artículo Publicado: {title}
          
          {message}
          
          Lee el artículo completo: {articleUrl}
          
          ---
          Recibiste esta notificación porque estás suscrito a actualizaciones de Stakeados.
          Cancelar suscripción: {unsubscribeUrl}
          Gestionar Preferencias: {preferencesUrl}
        `,
      },
    },
    new_news: {
      subject: {
        en: 'Breaking News: {title}',
        es: 'Noticia Importante: {title}',
      },
      html: {
        en: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FF88;">Breaking News</h2>
            <h3>{title}</h3>
            <p>{message}</p>
            <a href="{newsUrl}" style="background-color: #00FF88; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              Read News
            </a>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              You received this notification because you're subscribed to news updates from Stakeados.
              <a href="{unsubscribeUrl}">Unsubscribe</a> | 
              <a href="{preferencesUrl}">Manage Preferences</a>
            </p>
          </div>
        `,
        es: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FF88;">Noticia Importante</h2>
            <h3>{title}</h3>
            <p>{message}</p>
            <a href="{newsUrl}" style="background-color: #00FF88; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              Leer Noticia
            </a>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Recibiste esta notificación porque estás suscrito a actualizaciones de noticias de Stakeados.
              <a href="{unsubscribeUrl}">Cancelar suscripción</a> | 
              <a href="{preferencesUrl}">Gestionar Preferencias</a>
            </p>
          </div>
        `,
      },
      text: {
        en: `
          Breaking News: {title}
          
          {message}
          
          Read the full news: {newsUrl}
          
          ---
          You received this notification because you're subscribed to news updates from Stakeados.
          Unsubscribe: {unsubscribeUrl}
          Manage Preferences: {preferencesUrl}
        `,
        es: `
          Noticia Importante: {title}
          
          {message}
          
          Lee la noticia completa: {newsUrl}
          
          ---
          Recibiste esta notificación porque estás suscrito a actualizaciones de noticias de Stakeados.
          Cancelar suscripción: {unsubscribeUrl}
          Gestionar Preferencias: {preferencesUrl}
        `,
      },
    },
    daily_digest: {
      subject: {
        en: 'Your Daily Stakeados Digest',
        es: 'Tu Resumen Diario de Stakeados',
      },
      html: {
        en: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FF88;">Your Daily Digest</h2>
            <p>Here's what happened today on Stakeados:</p>
            
            {articlesSection}
            {newsSection}
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="{platformUrl}" style="background-color: #00FF88; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Visit Stakeados
              </a>
            </div>
            
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              You received this digest because you're subscribed to daily updates from Stakeados.
              <a href="{unsubscribeUrl}">Unsubscribe</a> | 
              <a href="{preferencesUrl}">Manage Preferences</a>
            </p>
          </div>
        `,
        es: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00FF88;">Tu Resumen Diario</h2>
            <p>Esto es lo que pasó hoy en Stakeados:</p>
            
            {articlesSection}
            {newsSection}
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="{platformUrl}" style="background-color: #00FF88; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Visitar Stakeados
              </a>
            </div>
            
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Recibiste este resumen porque estás suscrito a actualizaciones diarias de Stakeados.
              <a href="{unsubscribeUrl}">Cancelar suscripción</a> | 
              <a href="{preferencesUrl}">Gestionar Preferencias</a>
            </p>
          </div>
        `,
      },
      text: {
        en: `
          Your Daily Stakeados Digest
          
          Here's what happened today on Stakeados:
          
          {articlesText}
          {newsText}
          
          Visit Stakeados: {platformUrl}
          
          ---
          You received this digest because you're subscribed to daily updates from Stakeados.
          Unsubscribe: {unsubscribeUrl}
          Manage Preferences: {preferencesUrl}
        `,
        es: `
          Tu Resumen Diario de Stakeados
          
          Esto es lo que pasó hoy en Stakeados:
          
          {articlesText}
          {newsText}
          
          Visitar Stakeados: {platformUrl}
          
          ---
          Recibiste este resumen porque estás suscrito a actualizaciones diarias de Stakeados.
          Cancelar suscripción: {unsubscribeUrl}
          Gestionar Preferencias: {preferencesUrl}
        `,
      },
    },
  };

  async sendNotificationEmail(data: EmailNotificationData): Promise<void> {
    try {
      // Check if user has email notifications enabled
      const preferences =
        await notificationPreferencesService.getUserPreferences(data.user.id);
      if (!preferences.emailEnabled) {
        console.log(`Email notifications disabled for user ${data.user.id}`);
        return;
      }

      // Check quiet hours (basic local check from stored preferences)
      const inQuietHours = this.isInQuietHours(
        preferences.quietHoursStart,
        preferences.quietHoursEnd
      );
      if (inQuietHours && data.notification.type !== 'breaking_news') {
        console.log(`User ${data.user.id} is in quiet hours, skipping email`);
        return;
      }

      const template = this.templates[data.notification.type];
      if (!template) {
        throw new Error(
          `No email template found for notification type: ${data.notification.type}`
        );
      }

      const locale = data.user.preferredLocale || 'en';
      const subject = this.interpolateTemplate(
        template.subject[locale] || template.subject.en,
        {
          title: data.notification.title[locale] || data.notification.title.en,
          ...data.notification.data,
        }
      );

      const html = this.interpolateTemplate(
        template.html[locale] || template.html.en,
        {
          title: data.notification.title[locale] || data.notification.title.en,
          message:
            data.notification.message[locale] || data.notification.message.en,
          unsubscribeUrl: data.unsubscribeUrl,
          preferencesUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/settings/notifications`,
          ...data.notification.data,
        }
      );

      const text = this.interpolateTemplate(
        template.text[locale] || template.text.en,
        {
          title: data.notification.title[locale] || data.notification.title.en,
          message:
            data.notification.message[locale] || data.notification.message.en,
          unsubscribeUrl: data.unsubscribeUrl,
          preferencesUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/settings/notifications`,
          ...data.notification.data,
        }
      );

      await EmailService.sendEmail(data.user.email, { subject, html, text });

      // Update delivery status (server-side)
      await this.updateDeliveryStatus(data.notification.id, 'email', 'sent');

      console.log(`Email notification sent to ${data.user.email}`);
    } catch (error) {
      console.error('Error sending email notification:', error);

      // Update delivery status to failed (server-side)
      await this.updateDeliveryStatus(data.notification.id, 'email', 'failed');

      throw error;
    }
  }

  async sendDigestEmail(data: DigestEmailData): Promise<void> {
    try {
      // Check if user has email notifications enabled
      const preferences =
        await notificationPreferencesService.getUserPreferences(data.user.id);
      if (!preferences.emailEnabled || preferences.digestFrequency === 'none') {
        console.log(`Email digest disabled for user ${data.user.id}`);
        return;
      }

      const template = this.templates.daily_digest;
      const locale = data.user.preferredLocale || 'en';

      // Build articles section
      const articlesSection = this.buildArticlesSection(
        data.digest.content.articles,
        locale
      );
      const newsSection = this.buildNewsSection(
        data.digest.content.news,
        locale
      );

      const subject = template.subject[locale] || template.subject.en;

      const html = this.interpolateTemplate(
        template.html[locale] || template.html.en,
        {
          articlesSection,
          newsSection,
          platformUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}`,
          unsubscribeUrl: data.unsubscribeUrl,
          preferencesUrl: data.managePreferencesUrl,
        }
      );

      const articlesText = this.buildArticlesText(
        data.digest.content.articles,
        locale
      );
      const newsText = this.buildNewsText(data.digest.content.news, locale);

      const text = this.interpolateTemplate(
        template.text[locale] || template.text.en,
        {
          articlesText,
          newsText,
          platformUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}`,
          unsubscribeUrl: data.unsubscribeUrl,
          preferencesUrl: data.managePreferencesUrl,
        }
      );

      await EmailService.sendEmail(data.user.email, { subject, html, text });

      console.log(`Digest email sent to ${data.user.email}`);
    } catch (error) {
      console.error('Error sending digest email:', error);
      throw error;
    }
  }

  private async updateDeliveryStatus(
    notificationId: string,
    deliveryType: 'in_app' | 'email' | 'push',
    status: 'sent' | 'failed'
  ): Promise<void> {
    const supabase = await createClient();
    // Fetch current status
    const { data: notification } = await supabase
      .from('notifications')
      .select('delivery_status')
      .eq('id', notificationId)
      .single();

    const current: Record<string, string> =
      ((notification as any)?.delivery_status as Record<string, string>) || {};
    const updated: any = { ...current, [deliveryType]: status };

    const supabaseAny = supabase as any;
    await supabaseAny
      .from('notifications')
      .update({ delivery_status: updated })
      .eq('id', notificationId);
  }

  private interpolateTemplate(
    template: string,
    variables: Record<string, any>
  ): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  private isInQuietHours(start?: string | null, end?: string | null): boolean {
    if (!start || !end) return false;
    // Expect HH:mm format
    const now = new Date();
    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number);
      return (h % 24) * 60 + (m % 60);
    };
    const cur = now.getHours() * 60 + now.getMinutes();
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (Number.isNaN(s) || Number.isNaN(e)) return false;
    // If window crosses midnight
    if (s > e) {
      return cur >= s || cur < e;
    }
    return cur >= s && cur < e;
  }

  private buildArticlesSection(articles: any[], locale: string): string {
    if (articles.length === 0) return '';

    const title = locale === 'es' ? 'Nuevos Artículos' : 'New Articles';
    let html = `<div style="margin: 24px 0;"><h3>${title}</h3>`;

    articles.forEach(article => {
      const articleTitle = article.title[locale] || article.title.en;
      const articleSummary = article.summary[locale] || article.summary.en;
      const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/${locale === 'es' ? 'articulos' : 'articles'}/${article.id}`;

      html += `
        <div style="border-left: 3px solid #00FF88; padding-left: 16px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px 0;"><a href="${articleUrl}" style="color: #333; text-decoration: none;">${articleTitle}</a></h4>
          <p style="margin: 0; color: #666; font-size: 14px;">${articleSummary}</p>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  private buildNewsSection(news: any[], locale: string): string {
    if (news.length === 0) return '';

    const title = locale === 'es' ? 'Noticias Destacadas' : 'Featured News';
    let html = `<div style="margin: 24px 0;"><h3>${title}</h3>`;

    news.forEach(newsItem => {
      const newsTitle = newsItem.title[locale] || newsItem.title.en;
      const newsSummary = newsItem.summary[locale] || newsItem.summary.en;
      const newsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/${locale === 'es' ? 'noticias' : 'news'}/${newsItem.id}`;

      html += `
        <div style="border-left: 3px solid #00FF88; padding-left: 16px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px 0;"><a href="${newsUrl}" style="color: #333; text-decoration: none;">${newsTitle}</a></h4>
          <p style="margin: 0; color: #666; font-size: 14px;">${newsSummary}</p>
          <p style="margin: 4px 0 0 0; color: #999; font-size: 12px;">Source: ${newsItem.source}</p>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  private buildArticlesText(articles: any[], locale: string): string {
    if (articles.length === 0) return '';

    const title = locale === 'es' ? 'NUEVOS ARTÍCULOS:' : 'NEW ARTICLES:';
    let text = `\n${title}\n`;

    articles.forEach(article => {
      const articleTitle = article.title[locale] || article.title.en;
      const articleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/${locale === 'es' ? 'articulos' : 'articles'}/${article.id}`;
      text += `- ${articleTitle}: ${articleUrl}\n`;
    });

    return text;
  }

  private buildNewsText(news: any[], locale: string): string {
    if (news.length === 0) return '';

    const title = locale === 'es' ? 'NOTICIAS DESTACADAS:' : 'FEATURED NEWS:';
    let text = `\n${title}\n`;

    news.forEach(newsItem => {
      const newsTitle = newsItem.title[locale] || newsItem.title.en;
      const newsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/${locale === 'es' ? 'noticias' : 'news'}/${newsItem.id}`;
      text += `- ${newsTitle}: ${newsUrl}\n`;
    });

    return text;
  }
}

export const emailNotificationService = new EmailNotificationService();
// Factory for compatibility with callers importing createEmailNotificationService
export function createEmailNotificationService() {
  return new EmailNotificationService();
}
