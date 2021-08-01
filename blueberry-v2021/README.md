# Blueberry Science Data Collection Web App

Run science experiments remotely or in the lab with the world's smallest and least expensive brain sensing wearable. You can use this web app on Linux, Mac, Windows, Android, iOS, and anything that supports Web Bluetooth.

## Design Your Own Experiment

You will probably only need to edit one file to add in your own experiment and data tags: **src/utils/ExperimentContent.js**

This class is for anyone who wants to run their own experiments.

Most of the Bluetooth connection, data saving, event saving, etc. has already been written, and you can just black box.

All you need to do is modify the follow React component to whatever you like and it will populate the content area of the data collection Blueberry webpage.

Then use the `this.props.saveEvent(eventNameString)` method to save any event you wish into the Blueberry datastream CSV.

Checkout some of the example ExperimentContent.js programs. Simply copy a file from its location to ExperimentContent.js and it will populate the site (make sure you're running `npm run` to render the changes).

## Install

1. Install npm.  

Linux and Mac: https://medium.com/@lucaskay/install-node-and-npm-using-nvm-in-mac-or-linux-ubuntu-f0c85153e173  
Windows: https://phoenixnap.com/kb/install-node-js-npm-on-windows  

2. Clone this repository (run anything that looks like `code` in your terminal):
```
git clone https://github.com/blueberryxtech/science_experiments_blueberry
cd science_experiments_blueberry 
```
3. Install dependencies:
```
npm i
```
4. Start a live build that will update when you make changes:
```
npm start
```
#### Optional - Deployment

Build to deploy:
```
npm run build
```
and place the resulting /build file on your server.

## Technical Documentation
### You probably don't need to understand this

utils/bby_connect.js - this handles connecting to the Blueberry, reconnecting upon disconnect, subscribing to data notifications, and passing the received raw data on to be parsed and saved

utils/bby_parse.js - this receives raw data fNIRS packets, parses them, aligns short and long data streams, receives event tags, and put it all into one data structure to be exported to CSV

## Support

cayden@blueberryx.com
