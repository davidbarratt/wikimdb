// @TODO find a better library than bluebird.
import { any } from 'bluebird';

// @TODO add an install listenerer to cache the html/js/css.

self.addEventListener( 'fetch', ( event ) => {

	if ( event.request.method !== 'GET' ) {
		return;
	}

	const url = new URL( event.request.url );

	if ( ![ 'upload.wikimedia.org', 'tools.wmflabs.org' ].includes( url.hostname ) ) {
		return;
	}

	// @TODO perhaps cache the images differently? should they be re-requested
	//       each time or only occassionally?
	event.respondWith(
		// Respond to whichever has the fastest fullfillment. Only fail if both fail.
		any( [
			caches.match( event.request ).then( ( response ) => {
				if ( !response ) {
					throw new Error( 'Cache miss!' );
				}

				return response;
			} ),
			fetch( event.request.clone() ).then( ( response ) => {
				if ( !response ) {
					console.log( "BYPASS CACHE 1", response );
					return response;
				}

				if ( response.type !== 'opaque' && !response.ok ) {
					console.log( "BYPASS CACHE 2", response );
					return response;
				}

				console.log("SAVING TO CACHE", response);

				// IMPORTANT: Clone the response. A response is a stream
				// and because we want the browser to consume the response
				// as well as the cache consuming the response, we need
				// to clone it so we have two streams.
				const responseToCache = response.clone();
				caches.open( 'content' ).then( ( cache ) => {
					cache.put( event.request, responseToCache );
				} );

				return response;
			} )
		] )
	);
} );

// Clear the cache! when does this execute? how can we control this?
self.addEventListener( 'activate', ( event ) => {
	event.waitUntil(
		caches.keys().then( ( cacheNames ) => {
			return Promise.all(
				cacheNames.map( ( cacheName ) => {
					console.log("DELETE", cacheName);
					return caches.delete(cacheName);
				} )
			);
		} )
	);
} );
