const path = require('path');

module.exports = {
  entry: './client.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
  }
};