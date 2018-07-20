/* eslint-env node */
const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const CleanWebpackPlugin = require( 'clean-webpack-plugin' );
const ScriptExtHtmlWebpackPlugin = require( 'script-ext-html-webpack-plugin' );
// const FaviconsWebpackPlugin = require( 'favicons-webpack-plugin' );

module.exports = ( env, argv ) => {
	const config = {
		entry: './index.js',
		output: {
			filename: 'scripts/[name].js',
			path: path.resolve( __dirname, 'html' )
		},
		devtool: argv.mode === 'production' ? 'source-map' : 'cheap-module-source-map',
		resolve: {
			alias: {
				app: path.resolve( './src' ),
				images: path.resolve( './images' )
			}
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /node_modules/,
					loader: 'babel-loader'
				},
				{
					test: /i18n\.dir\.js$/,
					loader: 'dir-loader'
				},
				{
					test: /\.scss$|\.css$/,
					use: [
						MiniCssExtractPlugin.loader,
						'css-loader',
						'sass-loader'
					]
				},
				{
					test: /\.(png|svg|jpg|gif)$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								outputPath: './images/'
							}
						}
					]
				},
				{
					test: /\.(eot|woff2|woff|ttf)$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								outputPath: './fonts/'
							}
						}
					]
				}
				// jQuery.i18n requres jQuery in the global scope.
				// {
				// 	test: require.resolve( 'jquery' ),
				// 	use: [
				// 		{
				// 			loader: 'expose-loader',
				// 			options: 'jQuery'
				// 		}
				// 	]
				// }
			]
		},
		plugins: [
			new MiniCssExtractPlugin( {
				filename: 'styles/[name].css',
				disable: argv.mode !== 'production'
			} ),
			// new FaviconsWebpackPlugin( path.resolve( './images/logo.png' ) ),
			new CleanWebpackPlugin( [ '../html' ], {
				exclude: [ 'api' ],
				allowExternal: true
			} ),
			new HtmlWebpackPlugin( {
				title: 'wikiMDb',
				inject: 'head',
				template: './index.ejs',
				hash: true,
				xhtml: true
			} ),
			new ScriptExtHtmlWebpackPlugin( {
				defaultAttribute: 'async'
			} )
		]
	};

	return config;
};
