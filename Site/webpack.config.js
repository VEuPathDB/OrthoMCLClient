var configure = require('@veupathdb/site-webpack-config');

module.exports = configure({
  entry: {
    'site-client': __dirname + '/webapp/wdkCustomization/js/client/main.js'
  },
  resolve: {
    alias: {
      'ortho-client': __dirname + '/webapp/wdkCustomization/js/client',
      'ortho-images': __dirname + '/webapp/wdkCustomization/images'
    }
  }
});
