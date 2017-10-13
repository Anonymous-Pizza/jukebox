import React from 'react';
import axios from 'axios';
import SpotifyWebApi from 'spotify-web-api-js';
import PlaylistEntry from './PlaylistEntry';
import PlayerGuest from './PlayerGuest.js';
import PlaylistSelector from './PlaylistSelector.js';
import StartParty from './StartParty.js';
import sampleData from '../lib/sampleData.js';
import Playlist from './Playlist.js';
import PlayerHost from './PlayerHost.js';
import Search from './Search.js';

const spotifyApi = new SpotifyWebApi();


class Party extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: '',
      userType: null,
      partyCode: null,

      currentPlaylist: '',
      songs: null,
      currentSong: '',
      interval: null,
      deviceId: '',
      playlists: ''
    }

    this.getAllSongs = this.getAllSongs.bind(this);
    this.upVote = this.upVote.bind(this);
    this.downVote = this.downVote.bind(this);
    // this.handlePlayButtonClick = this.handlePlayButtonClick.bind(this);
    this.joinAsGuest = this.joinAsGuest.bind(this);
    this.getDeviceId = this.getDeviceId.bind(this);
    this.getHostInfo = this.getHostInfo.bind(this);
    this.getSpotifyToken = this.getSpotifyToken.bind(this);
    this.createNewPlaylist = this.createNewPlaylist.bind(this);
    this.getExistingPlaylists = this.getExistingPlaylists.bind(this);
    this.handleCurrentPlaylistClick = this.handleCurrentPlaylistClick.bind(this);
    // this.songEnded = this.songEnded.bind(this);
    this.getPlaylistSongs = this.getPlaylistSongs.bind(this);
    this.createNewPlaylist = this.createNewPlaylist.bind(this);
    this.getCurrentSong = this.getCurrentSong.bind(this);
    this.switchToGuest = this.switchToGuest.bind(this);
    this.switchToHost = this.switchToHost.bind(this);
    this.generatePartyCode = this.generatePartyCode.bind(this);
  }

  componentDidMount() {

    if (this.getSpotifyToken()) {
      this.setState({userType: 'host'});
      this.getDeviceId();
      this.getHostInfo();
      // if(!this.state.partyCode) {
      //   this.generatePartyCode();
      // }
    }
    // this.getAllSongs();
  }

  getAllSongs() {
    axios.get(`/songs`)
    .then((response) => {
      this.setState({
        songs: response.data
      })
    })
    .catch((err) => {
      console.error.bind(err);
    })
  }

  getCurrentSong() {
    axios.get('/currentlyPlaying')
    .then((response) => {
      console.log("Currently Track/Song ID:",response.data.item.id);
      this.setState({
        currentSong: response.data.item.id
      })
    })
    .catch((err) => {
      console.error.bind(err);
    })
  }

  upVote(song) {
    song.vote = 1;
    axios.put('/song', song)
    .then((response) => {
      this.getAllSongs();
    })
    .catch((err) => {
      console.log(err);
    })
  }

  downVote(song) {
    song.vote = -1;
    axios.put('/song', song)
    .then((response) => {
      this.getAllSongs();
    })
    .catch((err) => {
      console.log(err);
    })
  }

  getSpotifyToken() {
    const getHashParams = () => {
    let hashParams = {};
    let e, r = /([^&;=]+)=?([^&;]*)/g;
    let q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
      return hashParams;
    }

    const params = getHashParams();
    const access_token = params.access_token;
    const refresh_token = params.refresh_token;

    spotifyApi.setAccessToken(access_token);
    return access_token;
  }
  //Should generate a random party code that will refer to the current session for host/users
  generatePartyCode() {
    var partyCode = this.generateRandomString(7);
    this.setState({partyCode: partyCode});
    axios.post('/party', {
      partyCode: this.state.partyCode,
      partyHost: this.state.currentUser,
      token: this.getSpotifyToken()
    });
  }

    //used for checking state of browser for authentication
  generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }


  //get the active device for the host user who is signed in to Spotify
  getDeviceId() {
    spotifyApi.getMyDevices()
      .then((data) => {
        this.setState({deviceId : data.devices[0].id});
      }, (err) =>{
        console.error(err);
      });
  }

  getHostInfo() {
    axios.get('/hostInfo', {
      params: {
        access_token: this.getSpotifyToken()
      }
    })
    .then((response) => {
      this.setState({currentUser : response.data.id});
    })
    .then((response) => {
      if(!this.state.partyCode) {
        this.generatePartyCode();
      }
    })
  }

  playCurrentSong(deviceId, trackId, duration) {
    spotifyApi.play({
      device_id: deviceId,
      uris: ['spotify:track:' + trackId]
    });
    if (this.state.interval) {
      clearInterval(this.state.interval);
    }
    var interval = setTimeout(this.songEnded.bind(this), duration);
    this.setState({interval: interval});
  };

  songEnded() {
    this.handlePlayButtonClick();
  }

//currently not working -- see waffleboard
  createNewPlaylist() {
    axios.post('/createNewPlaylist', {
      params: {
        currentUser: this.state.currentUser,
        name: 'myNewPlaylist',
        public: true
      }
    })
    .then((response) => {
      console.log("Making a new Playlist", response);
      console.log("ID Number:", response.location)
  //     this.setState({currentPlaylist: response.id}) //need to pull the playlist ID
    })
  }

  getExistingPlaylists() {
    axios.get('/hostPlaylists', {
      params: { access_token: this.getSpotifyToken()}
    })
    .then((response) => {
      console.log('Host Playlists:', response.data.items);
      this.setState({playlists: response.data.items});
    })
  }


  getPlaylistSongs() {
    axios.get('/playlistSongs', {
      params: {
        currentUser: this.state.currentUser,
        currentPlaylist: this.state.currentPlaylist
      }
    })
    .then((response) => {
      this.setState({songs: response.data.items})
      this.getCurrentSong();
    })
  }

  // handlePlayButtonClick () {
  //   const trackId = this.state.songs[0].link.split('track/')[1];
  //   const songId = this.state.songs[0]._id;
  //   this.setState({currentSong: this.state.songs[0]});
  //   this.playCurrentSong(this.state.deviceId, trackId, this.state.songs[0].duration_ms);
  //   this.removeSong(songId);
  // }

  joinAsGuest () {
    this.setState({userType: 'guest'});
    console.log('Joining as Guest');
    // this.getAllSongs();
    this.getPlaylistSongs();
  }

  removeSong(songId) {
    axios.delete('/song', {params: {id: songId}})
    .then((response) => {
      this.getAllSongs();
    })
    .catch((err) => {
      console.log(err);
    })
  }

  handleCurrentPlaylistClick(playlist) {
    console.log("Clicked PlaylistID:", playlist.id);
    // this.setState({currentPlaylist: playlist.id}, () => {
    //   this.getPlaylistSongs();
    // });

  }

  switchToGuest() {
    this.getCurrentSong();
    this.setState({userType: 'guest'})
  }

  switchToHost() {
    this.getCurrentSong();
    this.setState({userType: 'host'})
  }

  render() {
    var toBeRendered = () => {
      if (this.state.userType === null) {
        return (<StartParty joinAsGuest={this.joinAsGuest}/>);
      }
      if (this.state.userType === 'host') {
        return (
          <div>
              <div>
              <span className="switchUserType" onClick={this.switchToGuest}>Switch to Guest Mode</span>
              </div>
            <h2>HI {this.state.currentUser}!! Your Party Code: {this.state.partyCode}</h2>

            { !this.state.songs && <div><button onClick={this.createNewPlaylist}>Start a New Playlist</button></div>}
            { !this.state.songs && <div><button onClick={this.getExistingPlaylists}>Choose an Existing Playlist</button></div>}

            {this.state.currentUser && this.state.currentPlaylist &&
            <div className='hostPlayer'>
              <PlayerHost currentUser={this.state.currentUser} currentPlaylist={this.state.currentPlaylist}/>
            </div>
            }
            <div className='playlistList'>
              { this.state.playlists && <PlaylistSelector playlists={this.state.playlists} handleCurrentPlaylistClick={this.handleCurrentPlaylistClick} />}
            </div>

            { this.state.songs && <Playlist currentSong={this.state.currentSong} songs={this.state.songs} upVote={this.upVote} downVote={this.downVote} /> }
          </div>
        );
      }

      if (this.state.userType === 'guest') {
        return (
          <div>
              <div>
              <span className="switchUserType" onClick={this.switchToHost}>Switch to Host Mode</span>
              </div>
            <div className='playerGuest'>
              { this.state.currentSong && <PlayerGuest trackId={this.state.currentSong}/>}
            </div>
            <div className='playlistSongs'>
              { this.state.songs && <Playlist currentSong={this.state.currentSong} songs={this.state.songs} upVote={this.upVote} downVote={this.downVote} /> }

            </div>
          </div>
        )
      }
    }
      return (
        <div>
        {toBeRendered()}
        </div>
      )
  }
}


export default Party;


            // { this.state.songs && <div className='playButtonStyle'><button onClick={this.handlePlayButtonClick}>Play top song</button></div> }
            // { this.state.currentSong && <PlayerGuest trackId={this.state.currentSong.link.split('track/')[1]}/>}
