// import {CleanWebPackPlugin} from 'clean-webpack-plugin';
// import path from 'path';
const path = require('path');
const nodeExternals = require('webpack-node-externals');
// const CleanWebPackPlugin = require('clean-webpack-plugin');


module.exports = {
    // context: path.resolve(__dirname, 'static'),
    mode: 'development',
    entry: {
        app: './server.js',
    },
    target: 'node',
    externals: [nodeExternals()],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    // plugins: [
    //     new CleanWebPackPlugin(['dist']),
    // ],
    // module: {
    //     rules: [
    //         {
    //             test: /\.js$/,
    //             exclude: /node_modules/,
    //             use: {
    //                 loader: 'babel-loader',
    //                 options: {
    //                     presets: ['@babel/preset-env'],
    //                 },
    //             },
    //         },
    //     ],
    // },
};
