
var Dropbox = require('dropbox');


(function(window){
  window.utils = {
    parseQueryString: function(str) {
      var ret = Object.create(null);

      if (typeof str !== 'string') {
        return ret;
      }

      str = str.trim().replace(/^(\?|#|&)/, '');

      if (!str) {
        return ret;
      }

      str.split('&').forEach(function (param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        // Firefox (pre 40) decodes `%3D` to `=`
        // https://github.com/sindresorhus/query-string/pull/37
        var key = parts.shift();
        var val = parts.length > 0 ? parts.join('=') : undefined;

        key = decodeURIComponent(key);

        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val === undefined ? null : decodeURIComponent(val);

        if (ret[key] === undefined) {
          ret[key] = val;
        } else if (Array.isArray(ret[key])) {
          ret[key].push(val);
        } else {
          ret[key] = [ret[key], val];
        }
      });

      return ret;
    }
  };
})(window);


debugger;

/*var dbx = dbx = new Dropbox({ accessToken: 'SVvshC4nXcwAAAAAAAAUVupfvtR8-VW3DQN91NpNCbe74i-H35rjJIX4Bmi7LiGM' });

dbx.filesListFolder({path: ''})
    .then(function(response) {
      console.log(response.entries);
    })
    .catch(function(error) {
      console.error(error);
    });*/


var CLIENT_ID = 'qek5i8hcngzihxm';
    
// Parses the url and gets the access token if it is in the urls hash
function getAccessTokenFromUrl() {
	return utils.parseQueryString(window.location.hash).access_token;
}

// contain the access token.
function isAuthenticated() {
	return !!getAccessTokenFromUrl();
}
    

if (isAuthenticated()) {
	var dbx = new Dropbox({ accessToken: getAccessTokenFromUrl() });
	dbx.filesListFolder({path: ''})
	.then(function(response) {
	renderItems(response.entries);
	})
	.catch(function(error) {
	console.error(error);
	});
} else {
	var dbx = new Dropbox({ clientId: CLIENT_ID });
	dbx.getAuthenticationUrl('');
}
 

