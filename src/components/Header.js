import React from 'react';
import Search from './Search';
import { Link } from 'react-router-dom';



class Header extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      selectedItem: ''
    }
    this.handleToggle = this.handleToggle.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleToggle() {
    this.setState({open: !this.state.open});
  }
  handleClose () {
    this.setState({open: false});
  }

  render() {
    const navbarStyle = {
      zIndex: '1',
    }
    return (
      <div>
        <div className="header">
            <img src='http://i67.tinypic.com/335ej5e.png' alt='pizza jukebox' className="header-title" />
            <Link to="/" className="header-item">Home</Link>
            <Link to="/search" className="header-item">Search</Link>
            <Link to="/" className="header-item">Leave Party</Link>


        </div>
      </div>
    )
  }
}


export default Header;