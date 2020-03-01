import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from "axios";

class App extends Component {
  constructor(props) {
    super(props);

    const params = this.getHashParams();
    const token = params.access_token;

    this.state = {
      token: token,
      deviceId: "",
      loggedIn: token ? true : false,
      error: "",
      trackName: "Track Name",
      artistName: "Artist Name",
      albumName: "Album Name",
      playing: false,
      position: 0,
      duration: 0,
      searchText: "",
      displayResults: false,
      searchResults: [],
      currentTrack: "",
      searchLyrics: "",
      searchLyricsResults: []
    };

    // Method repeatedly checks until the SDK is ready
    this.playerCheckInterval = null;
    
    this.viewDevices = this.viewDevices.bind(this);
    this.submitSearch = this.submitSearch.bind(this);
    this.playTheSong = this.playTheSong.bind(this);
    this.submitSearchLyrics = this.submitSearchLyrics.bind(this);
  }

  // Extract the token from the URL string
  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    e = r.exec(q)
    while (e) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
       e = r.exec(q);
    }
    console.log("Hash Param token: ", hashParams);
    return hashParams;
  }

  onPrevClick() {
    this.player.previousTrack();
  }

  onPlayClick() {
    this.player.togglePlay();
  }
  
  onNextClick() {
    this.player.nextTrack();
  }

  onStateChanged(state) {
    // if we're no longer listening to music, we'll get a null state.
    if (state !== null) {
      const {
        current_track: currentTrack,
        position,
        duration,
      } = state.track_window;
      const trackName = currentTrack.name;
      const albumName = currentTrack.album.name;
      const artistName = currentTrack.artists
        .map(artist => artist.name)
        .join(", ");
      const playing = !state.paused;
      this.setState({
        position,
        duration,
        trackName,
        albumName,
        artistName,
        playing
      });
    }
  }

  // Event handlers that updates the app based on how web player's status
  createEventHandlers() {
    this.player.on('initialization_error', e => { console.error(e); });
    this.player.on('authentication_error', e => {
      console.error(e);
      this.setState({ loggedIn: false });
    });
    this.player.on('account_error', e => { console.error(e); });
    this.player.on('playback_error', e => { console.error(e); });
  
    // Playback status updates
    this.player.on('player_state_changed', state => this.onStateChanged(state));
  
    // Ready
    this.player.on('ready', data => {
      let { device_id } = data;
      console.log("Let the music play on!");
      this.setState({ deviceId: device_id });
    });
  }

  handleLogin() {
    if (this.state.token !== "") {
      console.log("Logged in with token ", this.state.token);
      // check every second for the player readiness
      this.playerCheckInterval = setInterval(() => this.checkForPlayer(), 1000);
    }
  }

  playASong() {
    // Method for placing a song track on play
    const play = ({
      spotify_uri,
      playerInstance: {
        _options: {
          getOAuthToken,
          id
        }
      }
    }) => {
      getOAuthToken(access_token => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [spotify_uri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
          },
        });
      });
    };

    play({
      playerInstance: this.player,
      spotify_uri: 'spotify:track:7xGfFoTpQ2E7fRF5lN10tr',
    });
  }

  playTheSong() {
    // Method for placing a song track on play
    const play = ({
      spotify_uri,
      playerInstance: {
        _options: {
          getOAuthToken,
          id
        }
      }
    }) => {
      getOAuthToken(access_token => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [spotify_uri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
          },
        });
      });
    };

    play({
      playerInstance: this.player,
      spotify_uri: this.state.currentTrack.uri,
    });
    
  }


  viewDevices() {
    let access_token = this.state.token;
    let spotify_uri = ''
    fetch(`https://api.spotify.com/v1/me/player/devices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
    })
    .then((response) => {
      // console.log("I am here (2)", this.state.next_url);
      if (!response.ok) throw Error(response.statusText);
      // console.log("nice");
      return response.json();
    })
    .then((data) => {
      console.log("Data:", data);
    })
    .catch((error) => console.log(error, 'ERROR CAUGHT IN APP.JS'));
  }

  // Checks if the player could be run using a token
  checkForPlayer() {
    const { token } = this.state;

    if (window.Spotify !== null && !this.player) {
      // cancel the interval that we were checking the player for
      clearInterval(this.playerCheckInterval);

      this.player = new window.Spotify.Player({
        name: "Rob's Spotify Player",
        getOAuthToken: cb => { 
          cb(token); 
        },
      });
      this.createEventHandlers();

      // finally, connect!
      this.player.connect();
    }
  }

  // Submit a search for songs based on the text input
  submitSearch(e) {
    const { token, searchText } = this.state;
    console.log("Fetching search with token:", token);
    fetch(`https://api.spotify.com/v1/search/?q=${searchText}&type=track`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
    .then((response) => {
      // console.log("I am here (2)", this.state.next_url);
      if (!response.ok) throw Error(response.statusText);
      // console.log("nice");
      return response.json();
    })
    .then((data) => {
      console.log("Search Data:", data.tracks);
      this.setState({
        displayResults: true,
        searchResults: data.tracks.items
      });
    })
    .catch((error) => console.log(error, 'ERROR CAUGHT IN APP.JS - Search'));

    e.preventDefault();
  }

  submitSearchLyrics(e) {
    let lyricsSearchText = 'hey jude';
    axios
      .get(
        `https://cors-anywhere.herokuapp.com/http://api.musixmatch.com/ws/1.1/track.search?q_lyrics=${lyricsSearchText}&apikey=b312d20523006d0a2dae3898ae8298b7`
      )
      .then(res => {
        console.log("Results", res.data.message.body.track_list);
        
      })
      .catch(err => console.log(err));


    // const { searchLyrics } = this.state;
    // fetch("https://api.musixmatch.com/ws/1.1/track.search?q_lyrics=what&apikey=b312d20523006d0a2dae3898ae8298b7", {
    // })
    // .then((response) => {
    //   if (!response.ok) throw Error(response.statusText);
    //   // console.log("nice");
    //   return response.json();
    // })
    // .then((data) => {
    //   console.log("Search Track by Lyrics Data:", data);
    //   // this.setState({
    //   //   displayResults: true,
    //   //   searchResults: data
    //   // });
    // })
    // .catch((error) => console.log(error, 'ERROR CAUGHT IN APP.JS - Search'));

    e.preventDefault();
  }


  render() {
    const { 
      token,
      loggedIn,
      artistName,
      trackName,
      albumName,
      error,
      position,
      duration,
      playing,
      searchText,
      displayResults,
      searchResults,
      searchLyrics,
      searchLyricsResults
    } = this.state;
  
    return (
      <div className="App">
        <div className="App-header">
          <h2>Now Playing</h2>
          <p>A Spotify Web Playback API Demo.</p>
        </div>

        {error && <p>Error: {error}</p>}

        {loggedIn ? 
        (<div>
          <button onClick={() => this.handleLogin()}>Get Player Ready</button>
          <p>Song Selected: {this.state.currentTrack ? this.state.currentTrack.name : (<span>None</span>)}</p>
          <button onClick={() => this.viewDevices()}>Devices</button>
          <button onClick={() => this.playTheSong()}>Play Selected</button>
          
          {/* Search a song */}
          <p>
            <input type="text" value={searchText} onChange={e => this.setState({ searchText: e.target.value })} />
          </p>
          <button onClick={this.submitSearch}>Search</button>

          <ul className='list-group'>
              {searchResults.slice(0,10).map((song) => (
                <li className='list-group-item'>
                  <button onClick={e => this.setState({ currentTrack:song })}>{song.name}</button>
                </li>
              ))}
            </ul>

          {/* {this.state.displayResults && (
            <ul>
              {searchResults.map((song) => (
                <p>{song.name}</p>
              ))}
            </ul>
          )} */}

          <div>
            <h2>Now Playing</h2>
            <p>Artist: {artistName}</p>
            <p>Track: {trackName}</p>
            <p>Album: {albumName}</p>
            <p>
              <button onClick={() => this.onPrevClick()}>Previous</button>
              <button onClick={() => this.onPlayClick()}>{playing ? "Pause" : "Play"}</button>
              <button onClick={() => this.onNextClick()}>Next</button>
            </p>
          </div>
        </div>)
        :
        (<div>
          {/* <p className="App-intro">
            Enter your Spotify access token. Get it from{" "}
            <a href="https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/#authenticating-with-spotify">
              here
            </a>.
          </p>
          <p>
            <input type="text" value={token} onChange={e => this.setState({ token: e.target.value })} />
          </p>
          <p>
          <button onClick={() => this.handleLogin()}>Go</button>
          </p> */}

          {/* From auth app */}
          <a href='http://localhost:8888' > Login to Spotify </a>
          
          {/* Lyrics Search functionality */}

          {/* Search a song by lyrics */}
          <p>
            <input type="text" value={searchLyrics} onChange={e => this.setState({ searchLyrics: e.target.value })} />
          </p>
          <button onClick={this.submitSearchLyrics}>Search Lyrics</button>
          <ul className='list-group'>
            {searchLyricsResults.slice(0,10).map((song) => (
              <li className='list-group-item'>
                {song}
              </li>
            ))}
          </ul>


        </div>)}
      </div>
    );
  }

}


export default App;
