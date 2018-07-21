import React from 'react';
import PropTypes from 'prop-types';
import { GraphQLClient } from 'graphql-request';
import md5 from 'crypto-js/md5';
import moment from 'moment';

const client = new GraphQLClient( 'http://127.0.0.1:8080/wdql.php' );

const query = `
query getItem($id: ID!) {
  item(id: $id) {
    label(language: "en") {
      text
    }
    images: statements(propertyIds: "P18", best: true) {
      data: mainsnak {
        ... on PropertyValueSnak {
          item: value {
            ... on StringValue {
              value
            }
          }
        }
      }
    }
    publication: statements(propertyIds: "P577", best: true) {
      data: mainsnak {
        ... on PropertyValueSnak {
          item: value {
            ... on TimeValue {
              value: time
            }
          }
        }
      }
    }
    duration: statements(propertyIds: "P2047", best: true) {
      data: mainsnak {
        ... on PropertyValueSnak {
          item: value {
            ... on QuantityValue {
              value: amount
            }
          }
        }
      }
    }
    mpaa: statements(propertyIds: "P1657", best: true) {
      data: mainsnak {
        ... on PropertyValueSnak {
          item: value {
            ... on Item {
              label(language: "en") {
                text
              }
            }
          }
        }
      }
    }
    genres: statements(propertyIds: "P136", best: true) {
      data: mainsnak {
        ... on PropertyValueSnak {
          item: value {
            ... on Item {
              label(language: "en") {
                text
              }
            }
          }
        }
      }
    }
  }
}
`;

const getFirstItem = ( data, name ) => {
	if (
		data.item[ name ] &&
		data.item[ name ].length &&
		data.item[ name ][ 0 ].data &&
		data.item[ name ][ 0 ].data.item
	) {
		return data.item[ name ][ 0 ].data.item;
	}

	return undefined;
};

class Item extends React.Component {

	constructor( props ) {
		super( props );

		this.state = {
			data: undefined
		};
	}

	componentDidMount() {
		const { match } = this.props;

		client.request( query, {
			id: 'Q' + match.params.id
		} ).then( ( data ) => {
			this.setState( { data } );
		} );
	}

	render() {
		const { data } = this.state;

		let title;
		let image;
		let hash;
		let filename;
		let publication;
		let mpaa;
		if ( data && data.item ) {

			if ( data.item.label && data.item.label.text ) {
				title = data.item.label.text;
			}

			image = getFirstItem( data, 'images' );
			if ( image ) {
				filename = image.value.replace( / /g, '_' );
				hash = md5( filename ).toString();
				image = `https://upload.wikimedia.org/wikipedia/commons/${hash.substring( 0, 1 )}/${hash.substring( 0, 2 )}/${encodeURIComponent( filename )}`;
			}

			publication = getFirstItem( data, 'publication' );
			if ( publication ) {
				publication = moment.utc( publication.value.substring( 1 ), moment.ISO_8601 ).format( 'YYYY' );
				publication = `(${publication})`;
			}

			mpaa = getFirstItem( data, 'mpaa' );
			if ( mpaa ) {
				mpaa = mpaa.label.text;
			}
		}

		return (
			<div>
				<div className="row">
					<div className="col">
						<h4>{title} {publication}</h4>
						<h5>{mpaa}</h5>
					</div>
				</div>
				<div className="row">
					<div className="col-4">
						<img src={image} alt={title} className="img-fluid" />
					</div>
				</div>
			</div>
		);
	}
}

Item.propTypes = {
	match: PropTypes.shape( {
		params: PropTypes.shape( {
			id: PropTypes.string
		} )
	} ).isRequired
};

export default Item;
