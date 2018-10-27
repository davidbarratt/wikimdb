import React, { Fragment } from 'react';
import Head from 'next/head';
import PropTypes from 'prop-types';
import md5 from 'crypto-js/md5';
import { DateTime, Duration } from 'luxon';
import get from 'lodash/get';
import fetch from 'isomorphic-unfetch';
import Layout from '../components/layout';

const endpoint = 'https://graphql.wmflabs.org/';

const query = `
query getItem($id: ID!) {
  wikidata {
    entity(id: $id) {
      ...EntityLabel
      logos: claims(property: "P154") {
        ...ClaimItemValue
      }
      images: claims(property: "P18") {
        ...ClaimItemValue
      }
      publication: claims(property: "P577") {
        ...ClaimItemValue
      }
      duration: claims(property: "P2047") {
        ...ClaimItemValue
      }
      mpaa: claims(property: "P1657") {
        ...ClaimItemValue
      }
      genres: claims(property: "P136") {
        ...ClaimItemValue
      }
      director: claims(property: "P57") {
        ...ClaimItemValue
      }
      screenwriter: claims(property: "P58") {
        ...ClaimItemValue
      }
    }
    director: entity(id: "P57") {
      ...EntityLabel
    }
    screenwriter: entity(id: "P58") {
      ...EntityLabel
    }
  }
}

fragment EntityLabel on Entity {
  label {
    value
  }
}

fragment ClaimItemValue on Claim {
  data: mainsnak {
    item: datavalue {
      ... on SnakValueQuantity {
        quantity: value {
          value: amount
        }
      }
      ... on SnakValueTime {
        time: value {
          value: time
        }
      }
      ... on SnakValueString {
        value
      }
      ... on SnakValuePage {
        page: value {
          value: title
        }
      }
      ... on SnakValueEntity {
        entity: value {
          ...EntityLabel
        }
      }
    }
  }
}
`;

const getLabelValues = ( data, key ) => ( {
	key,
	label: get( data, [ 'wikidata', key, 'label', 'value' ] ),
	values: get( data, [ 'wikidata', 'entity', key ], [] )
		.map( item => get( item, [ 'data', 'item', 'entity', 'label', 'value' ] ) )
		.filter( label => !!label )
} );

const Film = ( { data } ) => {
	const item = get( data, [ 'wikidata', 'entity' ] );

	if ( !item ) {
		return (
			<Layout>
				<h2>404</h2>
			</Layout>
		);
	}

	let title = get( item, [ 'label', 'value' ] );

	// @TODO Handle non-svg images.
	let image = get( item, [ 'logos', 0, 'data', 'item', 'page', 'value' ] );
	if ( !image ) {
		image = get( item, [ 'images', 0, 'data', 'item', 'page', 'value' ] );
	}

	if ( image ) {
		let filename = image.replace( 'File:', '' ).replace( / /g, '_' );
		let hash = md5( filename ).toString();
		image = `https://upload.wikimedia.org/wikipedia/commons/${hash.substring( 0, 1 )}/${hash.substring( 0, 2 )}/${encodeURIComponent( filename )}`;
	}

	// @TODO Publication date should be the date the user is in, otherwise, it
	//       should default to the publication country.
	let publication = get( item, [ 'publication', 0, 'data', 'item', 'time', 'value' ] );
	let release;
	let year;
	if ( publication ) {
		publication = DateTime.fromISO( publication.substring( 1 ), { setZone: true } );
		( { year } = publication );
		year = `(${year})`;
		release = publication.toLocaleString( { month: 'long', day: 'numeric', year: 'numeric' } );
	}

	// @TODO Get the rating for the country the user is in, otherwise default
	//       to the publication country.
	const mpaa = get( item, [ 'mpaa', 0, 'data', 'item', 'entity', 'label', 'value' ] );

	let duration = get( item, [ 'publication', 0, 'data', 'item', 'quantity', 'value' ] );
	if ( duration ) {
		duration = Duration.fromObject( { minutes: parseInt( duration ) } );
		if ( duration.hours ) {
			// @TODO Translate `h` and `min`
			duration = `${duration.hours}h ${duration.minutes}min`;
		} else {
			// @TODO Translate `min`
			duration = `${duration.minutes}min`;
		}
	}

	// @TODO Create a method to get all item labels as an array.
	const genres = get( item, [ 'genres' ], [] )
		.map( genre => get( genre, [ 'data', 'item', 'entity', 'label', 'value' ] ) )
		.filter( genre => !!genre )
		.join( ', ' );

	const details = [
		getLabelValues( data, 'director' ),
		getLabelValues( data, 'screenwriter' )
	].reduce( ( prev, { key, label, values } ) => {
		if ( !label || !values ) {
			return prev;
		}

		return [
			...prev,
			(
				<Fragment key={key}>
					<dt>{label}</dt>
					<dd>{values.join( ', ' )}</dd>
				</Fragment>
			)
		];
	}, [] );

	const meta = [ mpaa, duration, genres, release ].filter( i => !!i ).join( ' | ' );

	title = `${title} ${year}`;

	return (
		<Layout>
			<Head>
				<title>{title}</title>
			</Head>
			<div className="row">
				<div className="col-sm-3">
					<img src={image} alt={title} className="img-fluid" />
				</div>
				<div className="col-sm-9">
					<h5>{title}</h5>
					<h6>{meta}</h6>
				</div>
			</div>
			<div className="row">
				<div className="col">
					<dl>
						{details}
					</dl>
				</div>
			</div>
		</Layout>
	);
};

Film.getInitialProps = async ( { req, query: { id } } ) => {
	// @TODO Throw a 404 or something if this item is not an instance of Q11424.
	const params = new URLSearchParams( {
		query,
		variables: JSON.stringify( {
			id: 'Q' + id
		} )
	} );
	const url = endpoint + '?' + params.toString();

	const accaptLanguage = get( req, [ 'headers', 'accept-language' ] );
	let headers = {};

	if ( accaptLanguage ) {
		headers = {
			'Accept-Language': accaptLanguage
		};
	}

	const response = await fetch( url, {
		headers
	} );

	return response.json();
};

Film.propTypes = {
	data: PropTypes.shape( {
		item: PropTypes.shape( {
			label: PropTypes.shape( {
				text: PropTypes.string
			} )
		} )
	} ).isRequired
};

export default Film;
