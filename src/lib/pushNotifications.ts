// Web Push helper — handles subscription lifecycle from the browser side.
//
// Flow:
//   1. ensurePushSupported(): checks browser capability
//   2. requestPermission(): prompts the user for Notification permission
//   3. subscribe(): registers SW push subscription with VAPID key, sends to backend
//   4. unsubscribe(): tears down the local subscription and notifies backend
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushSupportStatus =
  | { supported: true }
  | { supported: false; reason: string };

export function ensurePushSupported(): PushSupportStatus {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'No estamos en un navegador' };
  }
  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'Tu navegador no soporta Service Workers' };
  }
  if (!('PushManager' in window)) {
    return { supported: false, reason: 'Tu navegador no soporta Web Push' };
  }
  if (!('Notification' in window)) {
    return { supported: false, reason: 'Tu navegador no soporta notificaciones' };
  }
  if (!VAPID_PUBLIC_KEY) {
    return {
      supported: false,
      reason: 'Configuración faltante (VAPID_PUBLIC_KEY)',
    };
  }
  // iOS Safari requires PWA install (added to home screen) before push works.
  // We don't block here — let the user try and the OS will prompt accordingly.
  return { supported: true };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.ready;
  return reg;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await getServiceWorkerRegistration();
  return reg.pushManager.getSubscription();
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function subscribe(): Promise<PushSubscription> {
  if (!VAPID_PUBLIC_KEY) throw new Error('VAPID_PUBLIC_KEY no configurada');

  const reg = await getServiceWorkerRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  // Persist on the server
  const { error } = await supabase.functions.invoke('push-subscribe', {
    method: 'POST',
    body: { subscription: sub.toJSON(), userAgent: navigator.userAgent },
  });
  if (error) throw error;

  return sub;
}

export async function unsubscribe(): Promise<void> {
  const sub = await getCurrentSubscription();
  if (!sub) return;

  await supabase.functions.invoke('push-subscribe', {
    method: 'DELETE',
    body: { endpoint: sub.endpoint },
  });
  await sub.unsubscribe();
}

export async function sendTestPush(): Promise<{ ok: boolean; sent?: number; error?: string }> {
  const { data, error } = await supabase.functions.invoke('push-send', {
    method: 'POST',
    body: {
      payload: {
        title: 'Notificación de prueba',
        body: 'Si ves esto, las notificaciones push están funcionando 🎉',
        url: '/admin/operations',
        tag: 'test',
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; sent?: number };
}
