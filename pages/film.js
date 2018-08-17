import React from 'react';
import Head from 'next/head';
import PropTypes from 'prop-types';
import qs from 'querystring';
import md5 from 'crypto-js/md5';
import { DateTime, Duration } from 'luxon';
import fetch from 'isomorphic-unfetch';
import Layout from '../components/layout';

const endpoint = 'https://tools.wmflabs.org/tptools/wdql.php';

const query = `
query getItem($id: ID!, $lang: String!) {
  item(id: $id) {
    label(language: $lang) {
      text
    }
    logos: statements(propertyIds: "P154", best: true) {
      ...StatementItemValue
    }
    images: statements(propertyIds: "P18", best: true) {
      ...StatementItemValue
    }
    publication: statements(propertyIds: "P577", best: true) {
      ...StatementItemValue
    }
    duration: statements(propertyIds: "P2047", best: true) {
      ...StatementItemValue
    }
    mpaa: statements(propertyIds: "P1657", best: true) {
      ...StatementItemValue
    }
    genres: statements(propertyIds: "P136", best: true) {
      ...StatementItemValue
    }
    director: statements(propertyIds: "P57", best: true) {
      ...StatementItemValue
    }
    screenwriter: statements(propertyIds: "P57", best: true) {
      ...StatementItemValue
    }
  }
  director: property(id: "P57") {
    ...ProperyLabel
  }
  screenwriter: property(id: "P58") {
    ...ProperyLabel
  }
}

fragment ProperyLabel on Property {
  label(language: $lang) {
    text
  }
}

fragment StatementItemValue on Statement {
  data: mainsnak {
    ... on PropertyValueSnak {
      item: value {
        ... on StringValue {
          value
        }
        ... on QuantityValue {
          value: amount
        }
        ... on TimeValue {
          value: time
        }
        ... on StringValue {
          value
        }
        ... on Item {
          label(language: $lang) {
            text
          }
        }
      }
    }
  }
}
`;

const getAllItems = ( data, name ) => {
	if ( data.item[ name ] && data.item[ name ].length ) {
		return data.item[ name ].reduce( ( prev, curr ) => (
			[
				...prev,
				curr.data.item
			]
		), [] );
	}

	return [];
};

const getAllItemLabels = ( data, name ) => (
	getAllItems( data, name ).reduce( ( list, item ) => {
		if ( !item ) {
			return list;
		}

		return [
			...list,
			item.label.text
		];
	}, [] )
);

const getLabelValues = ( data, key ) => ( {
	key,
	label: data[ key ] && data[ key ].label ? data[ key ].label.text : undefined,
	values: getAllItemLabels( data, key )
} );

const getFirstItem = ( data, name ) => {
	const items = getAllItems( data, name );

	if ( items[ 0 ] ) {
		return items[ 0 ];
	}

	return undefined;
};

const Film = ( { data } ) => {
	let title;
	let image;
	let hash;
	let filename;
	let year;
	let publication;
	let release;
	let meta = [];
	let mpaa;
	let duration;
	let genres;
	let details = [];

	// @TODO Return an error early if the item isn't there.
	if ( data && data.item ) {

		if ( data.item.label && data.item.label.text ) {
			title = data.item.label.text;
		}

		// @TODO Handle non-svg images.
		image = getFirstItem( data, 'logos' );
		if ( !image ) {
			image = getFirstItem( data, 'images' );
		}
		if ( image ) {
			filename = image.value.replace( / /g, '_' );
			hash = md5( filename ).toString();
			image = `https://upload.wikimedia.org/wikipedia/commons/${hash.substring( 0, 1 )}/${hash.substring( 0, 2 )}/${encodeURIComponent( filename )}`;
		}

		// @TODO Publication date should be the date the user is in, otherwise, it
		//       should default to the publication country.
		publication = getFirstItem( data, 'publication' );
		if ( publication ) {
			publication = DateTime.fromISO( publication.value.substring( 1 ) );
			year = publication.year;
			year = `(${year})`;
			release = publication.toLocaleString( { month: 'long', day: 'numeric', year: 'numeric' } );
		}

		// @TODO Get the rating for the country the user is in, otherwise default
		//       to the publication country.
		mpaa = getFirstItem( data, 'mpaa' );
		if ( mpaa && mpaa.label ) {
			mpaa = mpaa.label.text;
		}

		duration = getFirstItem( data, 'duration' );
		if ( duration ) {
			duration = Duration.fromObject( { minutes: parseInt( duration.value ) } );
			if ( duration.hours ) {
				// @TODO Translate `h` and `min`
				duration = `${duration.hours}h ${duration.minutes}min`;
			} else {
				// @TODO Translate `min`
				duration = `${duration.minutes}min`;
			}
		}

		// @TODO Create a method to get all item labels as an array.
		genres = getAllItemLabels( data, 'genres' ).join( ', ' );

		details = [
			getLabelValues( data, 'director' ),
			getLabelValues( data, 'screenwriter' )
		].map( ( { key, label, values } ) => (
			<React.Fragment key={key}>
				<dt>{label}</dt>
				<dd>{values.join( ', ' )}</dd>
			</React.Fragment>
		) );

	}

	meta = [ mpaa, duration, genres, release ].filter( i => !!i ).join( ' | ' );

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

Film.getInitialProps = async ( { query: { id, lang } } ) => {
	// @TODO Throw a 404 or something if this item is not an instance of Q11424.
	const url = endpoint + '?' + qs.stringify( {
		query,
		variables: JSON.stringify( {
			id: 'Q' + id,
			lang
		} )
	} );

	const response = await fetch( url );

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
