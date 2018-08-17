import React from 'react';
import PropTypes from 'prop-types';
import qs from 'querystring';
import md5 from 'crypto-js/md5';
import { DateTime, Duration } from 'luxon';
import fetch from 'isomorphic-unfetch';
import Layout from '../components/layout';

const endpoint = 'https://tools.wmflabs.org/tptools/wdql.php';

const query = `
query getItem($id: ID!) {
  item(id: $id) {
    label(language: "en") {
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
          label(language: "en") {
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

const getFirstItem = ( data, name ) => {
	const items = getAllItems( data, name );

	if ( items[ 0 ] ) {
		return items[ 0 ];
	}

	return undefined;
};

class Item extends React.Component {
	static async getInitialProps( { query: { id } } ) {
		const url = endpoint + '?' + qs.stringify( {
			query,
			variables: JSON.stringify( {
				id: 'Q' + id
			} )
		} );

		const response = await fetch( url );

		return response.json();
	}

	render() {
		const { data } = this.props;

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
		if ( data && data.item ) {

			if ( data.item.label && data.item.label.text ) {
				title = data.item.label.text;
			}

			image = getFirstItem( data, 'logos' );
			if ( !image ) {
				image = getFirstItem( data, 'images' );
			}
			if ( image ) {
				filename = image.value.replace( / /g, '_' );
				hash = md5( filename ).toString();
				image = `https://upload.wikimedia.org/wikipedia/commons/${hash.substring( 0, 1 )}/${hash.substring( 0, 2 )}/${encodeURIComponent( filename )}`;
			}

			publication = getFirstItem( data, 'publication' );
			if ( publication ) {
				publication = DateTime.fromISO( publication.value.substring( 1 ) );
				year = publication.year;
				year = `(${year})`;
				release = publication.toLocaleString( { month: 'long', day: 'numeric', year: 'numeric' } );
			}

			mpaa = getFirstItem( data, 'mpaa' );
			if ( mpaa ) {
				mpaa = mpaa.label.text;
			}

			duration = getFirstItem( data, 'duration' );
			if ( duration ) {
				duration = Duration.fromObject( { minutes: parseInt( duration.value ) } );
				if ( duration.hours ) {
					duration = `${duration.hours}h ${duration.minutes}min`;
				} else {
					duration = `${duration.minutes}min`;
				}
			}

			genres = getAllItems( data, 'genres' ).map( g => g.label.text.replace( /^film | film$/, '' ) ).join( ', ' );
		}

		meta = [ mpaa, duration, genres, release ].filter( i => !!i ).join( ' | ' );

		return (
			<Layout>
				<div className="row">
					<div className="col-3">
						<img src={image} alt={title} className="img-fluid" />
					</div>
					<div className="col-9">
						<h5>{title} {year}</h5>
						<h6>{meta}</h6>
					</div>
				</div>
			</Layout>
		);
	}
}

Item.propTypes = {
	data: PropTypes.object.isRequired,
};

export default Item;
