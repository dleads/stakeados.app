export class PushNotificationServiceServer {
  constructor(_supabase?: unknown) {}

  // Suscribe un usuario a notificaciones push (stub seguro)
  async subscribeToPush(
    userId: string,
    subscription: { endpoint: string; keys?: { p256dh?: string; auth?: string } },
    userAgent?: string
  ) {
    // En una implementación real haríamos upsert en DB.
    // Aquí devolvemos el objeto de suscripción recibido para evitar dependencias.
    return {
      userId,
      endpoint: subscription.endpoint,
      userAgent: userAgent || null,
      createdAt: new Date().toISOString(),
    };
  }

  // Desuscribe un endpoint (stub)
  async unsubscribeFromPush(userId: string, endpoint: string) {
    // No-op seguro. En producción, eliminaríamos el registro en DB.
    return { userId, endpoint, removed: true };
  }

  // Devuelve la clave pública VAPID si está configurada
  async getVapidPublicKey(): Promise<string> {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  }
}

