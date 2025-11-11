import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Sharpr.me',
		short_name: 'Sharpr',
		start_url: '/',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: '#000000',
		icons: [
			// Recommended PNGs for installability:
			{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
			{ src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
			// Keep SVG as a scalable fallback
			{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
		]
	};
}


