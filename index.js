/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './src/components/app';
import './index.scss';

function main() {

	if ( 'serviceWorker' in navigator ) {
		window.addEventListener( 'load', () => {
			navigator.serviceWorker.register( '/sw.js' ).then( ( registration ) => {
				// Registration was successful
				console.log( 'ServiceWorker registration successful with scope: ', registration.scope );
			} ).catch( ( err ) => {
				// registration failed :(
				console.log( 'ServiceWorker registration failed: ', err );
			} );
		} );
	}

	ReactDOM.render(
		<App />,
		document.getElementById( 'root' ),
	);
}

// Engage!
main();
