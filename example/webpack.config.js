var webpack = require('webpack');

module.exports = {
    cache: true,
    entry: {
        example: './example/src/index.js'
    },
    output: {
        path: __dirname + '/build',
        filename: 'example.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
            }
        })
    ],
    resolve: {
        root: __dirname,
        extensions: ['', '.webpack.js', '.web.js', '.js'],
        modulesDirectories: ['web_modules', 'node_modules']
    },
    module: {
        loaders: [{
            test: /\.es6\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader?optional[]=runtime'
        }]
    }
};
