/* sw.js — 복약 단골 PWA 서비스 워커
 * 역할: 앱 셸 오프라인 캐시. 사용자 건강 데이터는 절대 전송·저장하지 않는다
 * (로컬 퍼스트 원칙 — 데이터는 localStorage/IndexedDB에만 존재).
 */
const CACHE = "medapp-v1";
const SHELL = ["./index.html", "./manifest.json", "./icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
            return res;
          })
          .catch(() => caches.match("./index.html"))
    )
  );
});

/* 복용 알림 — 앱이 백그라운드여도 서비스 워커가 받을 수 있다(플랫폼 지원 시) */
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "notify") {
    self.registration.showNotification(d.title || "복약 단골", {
      body: d.body || "",
      tag: d.tag || "medapp",
    });
  }
});
