var cache = {};

module.exports = [{
	entry: 'test/test',
    target: 'web',
    output: {
    	filename: 'fluxthis-tests.js',
        path: __dirname + '/build'
    },
    module: {
		loaders: [
			{
				test: /\.es6\.js$/, 
				exclude: /node_modules/, 
				loader: 'babel-loader',
			}
		]
	},
	resolve: {
		root: [
			__dirname
		],
		extensions: ['', '.es6.js', '.js']
	},
	devtool: '#source-map',
	cache: cache
}, {
    entry: 'src/index',
    output: {
        library: 'fluxthis',
        libraryTarget: 'umd',
        filename: 'fluxthis.js',
        path: __dirname + '/build'
    },
	module: {
		loaders: [
			{
				test: /\.es6\.js$/, 
				exclude: /node_modules/, 
				loader: 'babel-loader',
			}
		]
	},
	resolve: {
		root: [
			__dirname
		],
		extensions: ['', '.es6.js', '.js']
	},
	devtool: '#source-map',
	cache: cache
}]
