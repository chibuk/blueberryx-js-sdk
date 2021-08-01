import React, { Component } from "react";

//components
import StatusBar from './StatusBar.js';
import LiveChart from './LiveChart.js';

//utilities
import BlueberryDevice from '../utils/bby_connect.js';

class ConnectBlueberry extends Component {
    render() {
        return (
            <button className="main-button" onClick={this.props.cb}>Connect Blueberry</button>
        )
    }
}


class TryConnectBlueberry extends Component {
    render() {
        return (
            <button className="main-button" onClick={this.props.cb}>Cancel Connecting...</button>
        )
    }
}


class DisconnectBlueberry extends Component {
    render() {
        return (
            <button className="main-button" onClick={this.props.cb}>Disconnect Blueberry</button>
        )
    }
}


class MainPage extends Component {
    constructor(props){
        super(props);
        this.state = {
            sf : 25,
            connect_state : 0,
            blueberryDevice : new BlueberryDevice(this.connect_cb.bind(this), this.disconnect_cb.bind(this), this.try_connect_cb.bind(this)),
            session_started : false,
            assesing : false,
            data_time : 15,
        }

        this.callConnect = this.callConnect.bind(this);
        this.callDisconnect = this.callDisconnect.bind(this);
        this.connect_cb = this.connect_cb.bind(this);
        this.disconnect_cb = this.disconnect_cb.bind(this);
        this.saveData = this.saveData.bind(this);
        this.clearData = this.clearData.bind(this);
        this.saveTestEvent = this.saveTestEvent.bind(this);
        this.saveEvent = this.saveEvent.bind(this);
    }

    //blueberry bluetooth funcs
    callConnect() {
        this.state.blueberryDevice.start_connection();
    }


    callDisconnect() {
        this.state.blueberryDevice.disconnect();
    }
    
    saveData() {
        this.state.blueberryDevice.saveData();
    }

    clearData() {
        //this.setState({ session_started : false });
        this.state.blueberryDevice.clearData();
    }

    saveTestEvent() {
        //this.setState({ session_started : false });
        this.state.blueberryDevice.saveEvent("test_event");
        // this.state.blueberryDevice.saveEvent("another_test_event");
    }

    saveEvent(event_name){
        console.log("CALLED");
        this.state.blueberryDevice.saveEvent(event_name);
    }

    connect_cb(){
        this.setState( {session_started : true}); //session has started if we have connected at least once
        console.log("CONNECTED");
        //this.state.connect_state = true;
        this.setState( {connect_state : 2} );
    }

    disconnect_cb(){
        console.log("DISCONNECTED");
        this.setState( {connect_state : 0} );
    }


    try_connect_cb(){
        console.log("TRYING TO CONNECT");
        this.setState( {connect_state : 1} );
    }

    render() {
        //connection button
        var connect_button;
        switch(this.state.connect_state) {
          case 0:
            connect_button = <ConnectBlueberry cb={this.callConnect} />;
            break;
          case 1:
            connect_button = <TryConnectBlueberry cb={this.callDisconnect}/>;
            break;
          case 2:
            connect_button = <DisconnectBlueberry cb={this.callDisconnect}/>;
            break;
          default:
            connect_button = <DisconnectBlueberry cb={this.callDisconnect}/>;
        }

        return (
            <div id="main-page-container">
                <StatusBar connect_state={this.state.connect_state} />
                <div className="flex-col">
                    <div className="flex-row buttons-row" style={{position: 'absolute', left: '20px'}}>
                        <a href="https://www.blueberryx.com"><img src="https://cdn.shopify.com/s/files/1/0304/7905/7027/files/logo_751c0d51-c8ff-410e-9597-5b27ae561b98_180x.png?v=1598187965" style={{height: '40px', width: '40px', marginTop: '14px'}}/></a>
                    </div>
                </div>
                <div className="flex-col">
                    <div id="title-and-buttons">
                        <div className="flex-row buttons-row">
                            {connect_button}
                            <button className="main-button" disabled={!(this.state.session_started)} onClick={this.saveData} >Save Data</button>
                            <button className="main-button" disabled={!(this.state.session_started)} onClick={this.clearData} >Clear Data</button>
                            <button className="main-button" disabled={!(this.state.session_started)} onClick={this.saveTestEvent} >Save Test Event</button>
                        </div>
                    </div>


                </div>
                <div id="live-chart-container" style={{height: '500px'}}>
                    <LiveChart sf={this.state.sf} blueberryDevice={this.state.blueberryDevice} height="500"/>
                 </div>

            </div>            
        )
    }
}

export default MainPage;

