const path = require('path');

module.exports = {
    entry: './playlistManager.ts',
    output: {
        filename: './playlistManager.js',
        path: path.join(__dirname, 'dist') 
    },
    module: {
        rules: [{
            test: /\.ts(x?)$/,
            exclude: path.resolve(__dirname, './node_modules/'),
            use: [
                {
                    loader: 'ts-loader'
                }
            ]
        }]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};
