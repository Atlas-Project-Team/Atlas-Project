const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');


module.exports = {
    entry: {
        main: './src/index.ts',
        auth: './src/auth.ts'

    },
    module: {
        rules: [
            {
                test: /\.(png|jpg|svg|gif)$/,
                loader: 'url-loader'
            },
            {
                test: /\.(tsx|ts)$/,
                include: [
                    path.resolve(__dirname, 'src/index.ts'),
                    path.resolve(__dirname, 'src/auth.ts'),
                ],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: path.resolve('./tsconfig.json'),
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            }
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
        filename: "[name].bundle.js",
        chunkFilename: '[name].bundle.js',
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({debug: true}),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "index.html"),
            filename: "index.html",
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "404.html"),
            filename: "404.html",
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "auth.html"),
            filename: "auth.html",
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "auth", "popup.html"),
            filename: "auth/popup.html",
            inject: false
        }),
        new CopyPlugin({
            patterns: [
                {from: 'src/draco', to: 'draco'},
            ],
        }),
    ],
    watch: true,
    mode: 'development'
};