import React, { Component } from 'react';

class TeammateProfile extends Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    return(
      <div className="teammateProfile">
        {/* Profile picture */}
        <img src={this.props.imageLink} alt="logo"/>
        {/* Small colored circle */}
        <div className="profileCircleIcon">
          <img src={this.props.circleIcon} alt="logo" style={{marginTop : '5vh'}}/>
        </div>
        {/* Full name  */}
        <div className="profileText">
          <h2>{this.props.fullName}</h2>
          {/* Bio text  */}
          <div className="p6">{this.props.text}</div>
        </div>
      </div>
    );
  }
}

export default TeammateProfile;
