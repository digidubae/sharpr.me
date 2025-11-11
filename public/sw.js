const CACHE_NAME = 'sharpr-cache-v1';

self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;

	event.respondWith(
		fetch(request)
			.then((response) => {
				const responseClone = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone)).catch(() => {});
				return response;
			})
			.catch(() => caches.match(request))
	);
});


