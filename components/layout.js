import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import '../styles/style.scss';

const Layout = ( { children } ) => (
	<React.Fragment>
		<Head>
			<link rel="stylesheet" href="/_next/static/style.css" />
		</Head>
		<div className="container">
			<h1>wikiMDb</h1>
			{children}
		</div>
	</React.Fragment>
);

Layout.propTypes = {
	children: PropTypes.node
};

Layout.defaultProps = {
	children: undefined
};

export default Layout;
