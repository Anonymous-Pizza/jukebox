import React from 'react';
import PlaylistEntry from './PlaylistEntry';


const Playlist = (props) => {
  return (
    <div>
    <p>SONGS: </p>
      { props.songs.map((song, i) => {
        return (
          <PlaylistEntry key={i} position={i} downVote={props.downVote} handlePlay={props.handlePlayButtonClick} upVote={props.upVote} song={song}/>
        )})
      }

    </div>
  );
}


export default Playlist;
