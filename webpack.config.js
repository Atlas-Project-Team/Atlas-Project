const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const { VuetifyLoaderPlugin } = require('vuetify-loader')
const nodeExternals = require('webpack-node-externals');

module.exports = {
    target: 'web',
    //externals: [nodeExternals()],
    entry: {
        main: './src/index.ts',
        auth: './src/auth.ts',
        test: './src/newIndex.ts'

    },
    module: {
        rules: [
            {
                test: /\.(png|jpg|svg|gif)$/,
                loader: 'url-loader'
            },
            {
                test: /\.vue$/,
                use: [
                    'vue-loader',
                ],
                include: [
                    path.resolve(__dirname, 'src/components/objects.vue')
                ]
            },
            {
                test: /\.(tsx|ts)$/,
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
                    'vue-style-loader',
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.s([ca])ss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: require('sass'),
                            sassOptions: {
                                fiber: require('fibers'),
                                indentedSyntax: true
                            },
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.vue'],
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
        new VueLoaderPlugin(),
        new VuetifyLoaderPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "index.html"),
            filename: "index.html",
            cache: false,
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "404.html"),
            filename: "404.html",
            cache: false,
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "auth.html"),
            filename: "auth.html",
            cache: false,
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "newIndex.html"),
            filename: "newIndex.html",
            cache: false,
            inject: false
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "auth", "popup.html"),
            filename: "auth/popup.html",
            cache: false,
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