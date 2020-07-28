const path = require('path');

module.exports = {
    entry: {
        main: './src/index.ts',
        auth: './src/auth.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [
                    path.resolve(__dirname, "node_modules"),
                    path.resolve(__dirname, "src/draco"),
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js'
        },
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
    watch: false,
    mode: 'production'
};