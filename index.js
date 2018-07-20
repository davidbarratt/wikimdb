/* eslint-env browser */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './src/components/app';
import './index.scss';

function main() {

	ReactDOM.render(
		<App />,
		document.getElementById( 'root' ),
	);
}

// Engage!
main();
