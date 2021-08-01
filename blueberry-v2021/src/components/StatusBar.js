import React, { Component } from "react";

import { TiStarburst } from 'react-icons/ti'

class StatusBar extends Component{
    constructor(props) {
        super(props);
        this.state = {
            connect_state : 0,
        }
    }

    connect_colors = ["#FF0000", "#fadb26", "#1aab40"];
    connect_messages= ["Disconnected", "Trying To Connect", "Connected"];

    render() {
        return (
    <div id="bottombarsticky">
        <div id="connectionstate">
            <div className="reacticon" style={{color: this.connect_colors[this.props.connect_state]}}>
                <TiStarburst size={44} />
            </div>
            <h1><b>{this.connect_messages[this.props.connect_state]}</b></h1>
        </div>
    </div>

        )
    }
}

export default StatusBar;
