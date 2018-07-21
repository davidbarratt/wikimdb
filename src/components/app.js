import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Item from './item';

const App = () => (
	<div className="container">
		<h1>
			wikiMDb
		</h1>
		<Router>
			<Route path="/item/:id" component={Item} />
		</Router>
	</div>
);

export default App;
