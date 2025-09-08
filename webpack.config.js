const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    // No background service worker (using standalone worker.js)
    content: './src/content/content.js',
    popup: './src/popup/popup.js',
    options: './src/options/options.js',
    generator: './src/generator/generator-ui.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: {
      keep: /worker\.js$/ // Keep worker.js when cleaning output directory
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/popup/popup.css', to: 'popup.css' },
        { from: 'src/options/options.html', to: 'options.html' },
        { from: 'src/options/options.css', to: 'options.css' },
        { from: 'src/generator/generator.html', to: 'generator.html' },
        { from: 'src/generator/generator.css', to: 'generator.css' },
        { from: 'worker.js', to: 'worker.js' }
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
