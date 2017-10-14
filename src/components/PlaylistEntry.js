import React from 'react';


const PlaylistEntry = (props) => {
  const handleUpVote = () => {
    props.upVote(props.song);
  }

  const handleDownVote = () => {
    props.downVote(props.song);
  }

  const handlePlayButtonClick = () => {
    props.handlePlay(props.song);
  }

  return (
    <div className='playlistEntry'>
      <p>Song Title: {props.song.name} </p>
      <p>Artist: {props.song.artist}</p>
      <p>Added By: {props.song.userName}</p>
      <p>Total Count: {props.song.netVoteCount}</p>
      <img width='100px' height='100px' src={props.song.image}/>
      <p>Downvote Count: {props.song.downVoteCount}<button onClick={handleDownVote}> - </button></p>
      <p>Upvote Count: {props.song.upVoteCount}<button onClick={handleUpVote}> + </button></p>
      <hr />
    </div>
  );
}


export default PlaylistEntry;