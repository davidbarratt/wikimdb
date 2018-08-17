const next = require( 'next' );
const Hapi = require( 'hapi' );
const { pathWrapper, defaultHandlerWrapper, nextHandlerWrapper } = require( './next-wrapper' );

const dev = process.env.NODE_ENV !== 'production';
const app = next( { dev } );
const server = new Hapi.Server( {
	port: 80
} );

app
	.prepare()
	.then( async () => {

		server.route( {
			method: 'GET',
			path: '/',
			handler: pathWrapper( app, '/' )
		} );

		server.route( {
			method: 'GET',
			path: '/film/{id}',
			handler: pathWrapper( app, '/film' )
		} );

		server.route( {
			method: 'GET',
			path: '/item/{id}',
			handler: ( request, h ) => h.redirect( `/film/${request.params.id}` )
		} );

		server.route( {
			method: 'GET',
			path: '/_next/{p*}', /* next specific routes */
			handler: nextHandlerWrapper( app )
		} );

		server.route( {
			method: 'GET',
			path: '/{p*}', /* catch all route */
			handler: defaultHandlerWrapper( app )
		} );

		try {
			await server.start();
			console.log( '> Ready on http://localhost:80' )
		} catch (error) {
			console.log( 'Error starting server' );
			console.log( error );
		}
	} );
