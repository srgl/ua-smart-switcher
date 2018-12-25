const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  entry: {
    popup: __dirname + '/src/js/popup.js'
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['build']),
    new CopyWebpackPlugin([{
      from: 'src/manifest.json',
      transform: content => {
        return Buffer.from(JSON.stringify({
          name: process.env.npm_package_name,
          description: process.env.npm_package_description,
          version: process.env.npm_package_version,
          ...JSON.parse(content.toString())
        }))
      }
    }, {
      from: 'src/img',
      to: '.'
    }]),
    new HtmlWebpackPlugin({
      template: __dirname + '/src/popup.html',
      filename: 'popup.html'
    })
  ]
}
