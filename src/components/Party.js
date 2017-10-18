import React from 'react';
import axios from 'axios';
import SpotifyWebApi from 'spotify-web-api-js';
import PlaylistEntry from './PlaylistEntry';
import PlaylistSelector from './PlaylistSelector.js';
import StartParty from './StartParty.js';
import Playlist from './Playlist.js';
import Player from './Player.js';
import Search from './Search.js';


const spotifyApi = new SpotifyWebApi();

class Party extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: '', //eventually refactor to hostName
      userType: null,
      partyCode: null,
      access_token: null,
      deviceId: '',
      songs: null,
      hasSongs: false,
      currentSong: '',
      interval: null,
      playlists: '',
      guestName: null,
      searchList:null
    }

    //spotify functions
    this.getDeviceId = this.getDeviceId.bind(this);
    this.getSpotifyToken = this.getSpotifyToken.bind(this);

    //party functions
    this.getHostInfo = this.getHostInfo.bind(this);
    this.updateGuestName = this.updateGuestName.bind(this);
    this.generatePartyCode = this.generatePartyCode.bind(this);
    this.joinAsGuest = this.joinAsGuest.bind(this);
    this.leaveParty = this.leaveParty.bind(this);
    this.removeParty = this.removeParty.bind(this);

    //song functions
    this.getAllSongs = this.getAllSongs.bind(this);
    this.removeAllSongs = this.removeAllSongs.bind(this);
    this.upVote = this.upVote.bind(this);
    this.downVote = this.downVote.bind(this);
    this.addSongs = this.addSongs.bind(this);
    this.removeSong = this.removeSong.bind(this);

    //player functions
    this.getCurrentSong = this.getCurrentSong.bind(this);
    this.songEnded = this.songEnded.bind(this);
    this.handlePlayButtonClick = this.handlePlayButtonClick.bind(this);

    //playlist functions
    this.searchHandler = this.searchHandler.bind(this);
    this.getPlaylistSongs = this.getPlaylistSongs.bind(this);
    this.getExistingPlaylists = this.getExistingPlaylists.bind(this);
    this.refreshJukebox = this.refreshJukebox.bind(this);
    this.handleCurrentPlaylistClick = this.handleCurrentPlaylistClick.bind(this);

  }

  componentDidMount() {
    if (this.getSpotifyToken()) {
      this.setState({userType: 'host'});
      this.getDeviceId();
      this.getHostInfo();
    }
  }

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Spotify Required Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  //get the active device for the host user who is signed in to Spotify
  getDeviceId() {
    spotifyApi.getMyDevices()
      .then((data) => {
        this.setState({deviceId : data.devices[0].id});
      }, (err) =>{
        console.error(err);
      });
  }

  getSpotifyToken() {
    var access_token;

    if (this.state.access_token) {
      access_token = this.state.access_token;
    } else {
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
      access_token = params.access_token;
      const refresh_token = params.refresh_token;
      this.setState({access_token: access_token});
      spotifyApi.setAccessToken(access_token);
    }
    return access_token;
  }

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Party Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

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

  joinAsGuest (partyCode) {
    axios.get('/party', {
      params: {
        partyCode: partyCode
      }
    })
    .then((response) => {
      var party= response.data;
      if (party) {
        this.setState({partyCode: party.partyCode})
        this.setState({userType: 'guest'});
        this.setState({currentUser: party.partyHost});
        this.setState({access_token: party.token});
        this.getAllSongs(party.partyCode);
        this.getCurrentSong();
      }
    })
  }

  updateGuestName(name){
    this.setState({guestName: name});
  }

  removeParty() {
    axios.delete('/party', {params: {partyCode: this.state.partyCode}})
    .then((response) => {

    })
    .catch((err) => {
      console.log(err);
    })
  }

  leaveParty(){
    if (this.state.userType === 'host') {
      this.removeAllSongs();
      this.removeParty();
    }
    this.setState({
      currentUser: '',
      userType: null,
      partyCode: null,
      access_token: null,
      deviceId: '',
      songs: null,
      hasSongs: false,
      currentSong: '',
      interval: null,
      playlists: '',
      guestName: null,
      searchList:null
    });
    window.location = '/';
  }


/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Song Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  addSongs(songs) {
    var addedBy;
    if (this.state.userType === 'host') {
      addedBy = this.state.currentUser;
    } else {
      console.log('name', this.state.guestName);
      if (this.state.guestName) {
        addedBy = this.state.guestName;
      } else {
        addedBy = 'Anonymous'
      }
    }
    if (this.state.partyCode) {
      axios.post('/songs', {
        songs:songs,
        partyCode: this.state.partyCode,
        userName: addedBy
      })
      .then((response)=> {
       this.getAllSongs(this.state.partyCode);
      })
    } else {
      window.location = '/';
    }
  }

  getAllSongs(partyCode) {
    if (this.state.partyCode) {
      axios.get('/songs', {
        params: {
          partyCode: partyCode
        }
      })
      .then((response) => {
        var songs = response.data;
        this.setState({songs : []});
        for (var i = 0 ; i < songs.length; i++) {
          this.state.songs.push(songs[i]);
        }
        if (this.state.songs.length > 0) {
          this.setState({hasSongs: true});
        } else {
          this.setState({hasSongs: false});
        }
      })
      .catch((err) => {
        console.error.bind(err);
      })
    } else {
      window.location = '/';
    }
  }

  removeSong(songId) {
    axios.delete('/song', {params: {id: songId}})
    .then((response) => {
      this.getAllSongs(this.state.partyCode);
    })
    .catch((err) => {
      console.log(err);
    })
  }

  removeAllSongs() {
    axios.delete('/songs', {params: {partyCode: this.state.partyCode}})
    .then((response) => {
      this.getAllSongs(this.state.partyCode);
    })
    .catch((err) => {
      console.log(err);
    })
  }

  upVote(song) {
    song.vote = 1;
    if (localStorage.getItem(song.partyCode + song._id)) {
      return;
    }
    axios.put('/song', song)
    .then((response) => {
      this.getAllSongs(this.state.partyCode);
      localStorage.setItem(song.partyCode + song._id, true);
    })
    .catch((err) => {
      console.log(err);
    })
  }

  downVote(song) {
    song.vote = -1;
    if (localStorage.getItem(song.partyCode + song._id)) {
      return;
    }
    axios.put('/song', song)
    .then((response) => {
      this.getAllSongs(this.state.partyCode);
      localStorage.setItem(song.partyCode + song._id, true);
    })
    .catch((err) => {
      console.log(err);
    })
  }

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Player Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  handlePlayButtonClick () {
    this.getAllSongs(this.state.partyCode);
    const trackId = this.state.songs[0].link.split('track/')[1];
    const songId = this.state.songs[0]._id;
    this.setState({currentSong: this.state.songs[0]});
    this.playCurrentSong(this.state.deviceId, trackId, this.state.songs[0].duration_ms);
    this.removeSong(songId);
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


/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Playlist Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  getExistingPlaylists() {
    axios.get('/hostPlaylists', {
      params: { access_token: this.getSpotifyToken()}
    })
    .then((response) => {
      var allPlaylists = response.data.items;
      var userOwnedPlaylists = [];
      for (var i = 0; i < allPlaylists.length ; i++) {
        if (allPlaylists[i].owner.id === this.state.currentUser) {
          userOwnedPlaylists.push(allPlaylists[i]);
        }
      }
      this.setState({playlists: userOwnedPlaylists});
    });
  }

  getPlaylistSongs(playlistId) {
    axios.get('/playlistSongs', {
      params: {
        user: this.state.currentUser,
        playlist: playlistId,
        access_token: this.getSpotifyToken()
      }
    })
    .then((response) => {
      //add all songs to database
      var songs = response.data.items;
      this.addSongs(songs);
    })
  }

  handleCurrentPlaylistClick(playlist) {
    this.getPlaylistSongs(playlist.id);
  }

  getCurrentSong() {
    axios.get('/currentlyPlaying', {
      params: {
        access_token : this.state.access_token
      }
    })
    .then((response) => {
      this.setState({
        currentSong: response.data.item
      })
    })
    .catch((err) => {
      console.error.bind(err);
    })
  }

  searchHandler(queryString) {
    axios.get('/songs/search', {
      params: {
        query: queryString,
        access_token: this.getSpotifyToken()
      }
    })
    .then((response) => {
      this.setState({ searchList: response.data.tracks.items});
    })
    .catch((err) => {
      console.error.bind(err);
    })
  }

  refreshJukebox() {
    this.getAllSongs(this.state.partyCode);
    this.getCurrentSong();
  }

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Helper Functions
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  //used for checking state of browser for authentication
  generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }


/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Render Based on user type
* * * * * * * * * * * * * * * * * * * * * * * * * * */

  render() {
    var toBeRendered = () => {
      if (this.state.userType === null) {
        return (<StartParty joinAsGuest={this.joinAsGuest}/>);
      }
      if (this.state.userType === 'host') {
        return (
          <div className='wipeLeft'>
            <div className="infoBarHost">
              { this.state.userType ? <button className="infoBarButton" onClick={this.leaveParty} >Leave Party</button> : '' }
              { this.state.hasSongs && <button className="infoBarButton" onClick={()=>{this.getAllSongs(this.state.partyCode)}}>Refresh Playlist</button> }
              <h2>HI {this.state.currentUser}!! Your Party Code: {this.state.partyCode}</h2>
            </div>

            { !this.state.hasSongs && 
              <div className ='hostPlaylistSelector'>
                <span className="hostPlaylistSelectorButton" onClick={this.getExistingPlaylists}>Choose an Existing Playlist</span>
                <div className='playlistListContainer'>
                  { this.state.playlists && <PlaylistSelector playlists={this.state.playlists} handleCurrentPlaylistClick={this.handleCurrentPlaylistClick} />}
                </div>
                <Search updateGuestName={this.updateGuestName} userType={this.state.userType} addSongs={this.addSongs} searchList={this.state.searchList} queryHandler={this.queryHandler} searchHandler={this.searchHandler} /> 
              </div>
            }

            { this.state.hasSongs && 
              <div className='dashboardContainer wipeLeft'>
                <div className='spotifyPlayerContainer'>
                  { this.state.currentSong && <Player trackId={this.state.currentSong.link.split('track/')[1]}/>}
                  <button className='playButton' onClick={this.handlePlayButtonClick}>{!this.state.currentSong ? 'Start Playlist' : 'Skip To Next Song'}</button>
                  <Search userType={this.state.userType} addSongs={this.addSongs} searchList={this.state.searchList} queryHandler={this.queryHandler} searchHandler={this.searchHandler} />
                </div>
                <div className='playlistContainer'>
                  <Playlist currentSong={this.state.currentSong} songs={this.state.songs} upVote={this.upVote} downVote={this.downVote} removeSong={this.removeSong} userType={this.state.userType} />
                </div>
              </div>
            }
          </div>
        );
      }
      if (this.state.userType === 'guest') {
        return (
          <div className="wipeLeft">
            <div className="infoBarGuest">
              { this.state.userType ? <button onClick= {this.leaveParty} className="infoBarButton">Leave Party</button> : '' }
              { <button className="infoBarButton" onClick={()=>{this.refreshJukebox()}}>Refresh Playlist</button>}
              <h2>Currently in {this.state.currentUser}'s Party! (Party Code: {this.state.partyCode})</h2>
            </div>

            <div className='currentlyPlayingContainer'>
              <div className='currentlyPlayingInner'>
                <img src="http://i66.tinypic.com/2rp9oih.png" alt="jukebox" /> <br />
                { this.state.currentSong && <p className='currentlyPlayingTitle'> Currently Playing: { this.state.currentSong.name } by { this.state.currentSong.artists[0].name } </p>}
              </div>
              <Search updateGuestName={this.updateGuestName} userType={this.state.userType} addSongs={this.addSongs} searchList={this.state.searchList} queryHandler={this.queryHandler} searchHandler={this.searchHandler}/>
            </div>

            <div className='playlistContainer'>
              { this.state.songs && <Playlist songs={this.state.songs} upVote={this.upVote} downVote={this.downVote} removeSong={this.removeSong} userType={this.state.userType}/> }
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