var cache = {};

module.exports = [{
	context: __dirname + '/test',
    entry: 'test',
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
			__dirname + '/test',
			__dirname + '/src'
		],
		extensions: ['', '.es6.js', '.js']
	},
	devtool: '#source-map',
	cache: cache
}, {
	context: __dirname + '/src',
    entry: 'index',
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
			__dirname,
			__dirname + '/src'
		],
		extensions: ['', '.es6.js', '.js']
	},
	devtool: '#source-map',
	cache: cache
}]
