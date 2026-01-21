/**
 * Push Notifications utility for Routine Minder
 * Uses Web Push API with Service Worker
 */

// VAPID public key - generate with: npx web-push generate-vapid-keys
// For production, store private key securely and set VITE_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn("Push notifications not supported");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log("Already subscribed to push notifications");
      return true;
    }

    // If no VAPID key configured, use local notifications only
    if (!VAPID_PUBLIC_KEY) {
      console.log("No VAPID key configured, using local notifications");
      return true;
    }

    // Subscribe with VAPID key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to server (optional - for server-side push)
    // await sendSubscriptionToServer(subscription);

    console.log("Subscribed to push notifications", subscription);
    return true;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log("Unsubscribed from push notifications");
    }
    
    return true;
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    return false;
  }
}

// Show a local notification (for testing or fallback)
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      ...options,
    });
    return true;
  } catch (error) {
    // Fallback to regular Notification if service worker not available
    try {
      new Notification(title, options);
      return true;
    } catch {
      console.error("Failed to show notification:", error);
      return false;
    }
  }
}

// Schedule a notification for a routine reminder
export function scheduleRoutineReminder(
  routineName: string,
  timeCategory: "AM" | "NOON" | "PM",
  delayMs: number = 0
): void {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return;
  }

  const timeLabels = {
    AM: "morning",
    NOON: "afternoon", 
    PM: "evening",
  };

  setTimeout(() => {
    showLocalNotification(`Time for ${routineName}`, {
      body: `Don't forget your ${timeLabels[timeCategory]} routine!`,
      tag: `routine-${routineName}-${timeCategory}`,
      requireInteraction: false,
    });
  }, delayMs);
}
