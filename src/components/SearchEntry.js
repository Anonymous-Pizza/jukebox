import React from 'react';


const SearchEntry = (props) => {
  const clickHandler = () => {
    console.log('clicked', props.Result);
    props.onAdd(props.Result);
  }

  return(
    <div>
      <div className='searchImage'>
        <img src={props.Result.album.images[2]} alt="" />
      </div>
      <div className='searchContent'>
        <p>Name: {props.Result.name}</p>
        <p>Artist: {props.Result.artists[0].name}</p>
      </div>
      <button onClick={clickHandler}>Add To Playlist</button>
    </div>
  )
}


export default SearchEntry;