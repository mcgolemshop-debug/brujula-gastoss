/**
 * Brújula Markets · Service Worker
 * Maneja Web Push y click-to-open.
 */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Brújula", body: "Tienes una notificación nueva" };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    if (event.data) {
      payload = { title: "Brújula", body: event.data.text() };
    }
  }
  const { title, body, url, icon, tag } = payload;
  event.waitUntil(
    self.registration.showNotification(title || "Brújula", {
      body: body || "",
      icon: icon || "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: tag || "brujula",
      data: { url: url || "/dashboard" },
      requireInteraction: false,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Si ya hay una pestaña abierta de la app, foco a ella y navega
        for (const c of clients) {
          if ("focus" in c && c.url.includes(self.location.origin)) {
            c.navigate(url).catch(() => {});
            return c.focus();
          }
        }
        // Si no, abre nueva
        return self.clients.openWindow(url);
      })
  );
});
