const credentials = require('../env/credentials.js');
const Promise = require('bluebird');
const cookieParser = require('cookie-parser');
const request = require('request');
const querystring = require('querystring');
const otherHelpers = require('./otherHelpers.js');



/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  OAUTH
* * * * * * * * * * * * * * * * * * * * * * * * * * */

//redirect host user to Spotify login page to obtain authorization code
exports.handleHostLogin = (req, res) => {
  console.log(credentials.redirect_uri)
  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative playlist-modify-public user-library-read user-read-currently-playing';

  res.cookie('spotify_auth_state', state);

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: credentials.client_id,
      scope: scope,
      redirect_uri: credentials.redirect_uri + '/callback/',
      state: state
    }));
};

//handle the redirect from Spotify after login and save the authorization code
exports.redirectAfterLogin = (req, res) => {
  const code = req.query.code || null;
  const playerAuthOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: credentials.redirect_uri + '/callback/',
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(credentials.client_id + ':' + credentials.client_secret).toString('base64'))
    },
    json: true
  };

  //make a new request to spotify API and provide the authorization code in exchange for a token
  request.post(playerAuthOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {

      const access_token = body.access_token;
      const refresh_token = body.refresh_token;

      //redirect host user back to playlist page and pass token to browser
      res.redirect(credentials.redirect_uri +'#' +
        querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token
        }));
    } else {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    }
  });
};


/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Search Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */


exports.getTrackSearchResults = (req, res, queryString) => {
  const options = {
    url: `https://api.spotify.com/v1/search?q=${queryString}&type=track&market=US&limit=10`,
    headers: {'Authorization': 'Bearer ' + req.query.access_token},
    json: true
  };
  request.get(options, function(error, response, body) {
    if (!error) {
      res.send(body);
    }
  });
};


/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Playlist Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

//gets a list of the host's playlists
exports.getHostPlaylists = (req, res) => {
  const settings = {
    url: 'https://api.spotify.com/v1/me/playlists',
    headers: {
      'Authorization': 'Bearer ' + req.query.access_token
    }
  }

  request.get(settings, function(error, response, body) {
    if (!error) {
      res.send(body);
    }
  })
}

//gets all the songs on a playlist
exports.getPlaylistSongs = (req, res) => {

  const settings = {
    url: 'https://api.spotify.com/v1/users/' + req.query.user + '/playlists/' + req.query.playlist + '/tracks',
    headers: {
      'Authorization': 'Bearer ' + req.query.access_token
    }
  }

  request.get(settings, function(error, response, body) {
    if(!error) {
      res.send(body);
    }
  })
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Player Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */
exports.currentlyPlaying = (req, res) => {
  const settings = {
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: {
      'Authorization': 'Bearer ' + req.query.access_token
    }
  }

  request.get(settings, function(error, response, body) {
    if (!error) {
      res.send(body);
    }
  })
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  User Info Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */
exports.getHostInfo = (req, res) => {
  var token = req.query.access_token;
  const settings = {
    url: 'https://api.spotify.com/v1/me',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }

  request.get(settings, function(error, response, body) {
    if (!error) {
      res.send(body);
    }
  })
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Helper Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

//used for checking state of browser for authentication
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};








