var path = require('path');

module.exports = {
  mode: 'development',
  entry: './tw5.js',
  resolve: {
     modules: [path.resolve(__dirname, '/home/manoj/node_modules/dropbox/src'), 'node_modules']
  },
  output: {
     filename: 'app.bundle.js'
  }
};
