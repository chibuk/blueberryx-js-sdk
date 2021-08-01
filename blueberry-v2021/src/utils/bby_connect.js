//This handles connecting to the Blueberry, reconnecting upon disconnect, subscribing to data notifications, and passing the received raw data on to be parsed and saved
//
////Blueberry, cayden
//https://googlechrome.github.io/samples/web-bluetooth/automatic-reconnect.html
//
//
//
//
import BlueberryData from './bby_data.js';

//Blueberry BT details
const services = {
  fnirsService: {
    name: 'fnirs service',
    uuid: '0f0e0d0c-0b0a-0908-0706-050403020100'
  }
}

const characteristics = {
  commandCharacteristic: {
    name: 'write characteristic',
    uuid: '1f1e1d1c-1b1a-1918-1716-151413121110'
  },
  fnirsLongCharacteristic: {
    name: 'read fnirs long data characteristic',
    uuid: '4f4e4d4c-4b5a-5958-5756-555453425150'
  },
  fnirsShortCharacteristic: {
    name: 'read fnirs short data characteristic',
    uuid: '4f4e4d4c-4b6a-6968-6766-656463426160'
  }
}

class BlueberryDevice {
    constructor(connect_cb, disconnect_cb, try_connect_cb){
        this.bbyBtDevice = null;
        this.bbyData = new BlueberryData();
        this.connected = false;
        this.connect_cb = connect_cb;
        this.disconnect_cb = disconnect_cb;
        this.try_connect_cb = try_connect_cb;
        this.try_connect = true;
    }

    start_connection() {
      this.bbyBtDevice = null;
      console.log('Requesting any Bluetooth Device...');
      navigator.bluetooth.requestDevice({
          //filters: [{namePrefix: "blueberry"}]})
          acceptAllDevices: true, 
          optionalServices: [services.fnirsService.uuid]})
      .then(device => {
        this.bbyBtDevice = device;
        this.bbyBtDevice.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
        this.connect();
      })
      .catch(error => {
        console.log('Argh! ' + error);
      });
    }

    disconnect(){
        this.try_connect = false;
        if (this.bbyBtDevice.gatt.connected){
            this.bbyBtDevice.gatt.disconnect();
        } else {
            this.disconnect_cb();
        }
    }

    connect() {
      this.try_connect = true;
      this.exponentialBackoff(30 /* max retries */, 1 /* seconds delay */,
        () => { //toTry
            this.try_connect_cb(); //call try connect callback
          this.time('Connecting to Bluetooth Device... ');
          return this.bbyBtDevice.gatt.connect();
        },
        (server) => { //success
            //console.log(server);
          console.log('> Bluetooth Device connected. Try disconnect it now.');
          this.connected = true;
          this.connect_cb();
          //now attempt to connect to notifications
          console.log('Subscribing to Blueberry data streams (notification characteristics)...');
          this.getServices([services.fnirsService], [characteristics.commandCharacteristic, characteristics.fnirsLongCharacteristic, characteristics.fnirsShortCharacteristic], server);
        },
        () => { //fail
          this.connected = false;
          this.time('Failed to reconnect.');
        });
    }


    onDisconnected() {
      console.log('> Bluetooth Device disconnected');
      this.connected = false;
      this.disconnect_cb();
      if (this.try_connect){
          this.connect();
      }
    }

    getConnectionState() {
        return this.connected;
    }

    /* Utils */

    // This function keeps calling "toTry" until promise resolves or has
    // retried "max" number of times. First retry has a delay of "delay" seconds.
    // "success" is called upon success.
    exponentialBackoff(max, delay, toTry, success, fail) {
      toTry().then(result => success(result))
      .catch(_ => {
        if (max === 0) {
          return fail();
        }
        this.time('Retrying in ' + delay + 's... (' + max + ' tries left)');
        setTimeout(function() {
          this.exponentialBackoff(--max, delay * 2, toTry, success, fail);
        }.bind(this), delay * 1000);
      });
    }

    getServices(requestedServices, requestedCharacteristics, server){
        this.standardServer = server;

        requestedServices.filter((service) => {
            //start up control command service
            if(service.uuid == services.fnirsService.uuid){
                this.getControlService(requestedServices, requestedCharacteristics, this.standardServer);
            }
        })
    }

    getControlService(requestedServices, requestedCharacteristics, server){
        let controlService = requestedServices.filter((service) => { return service.uuid == services.fnirsService.uuid});
        let commandChar = requestedCharacteristics.filter((char) => {return char.uuid == characteristics.commandCharacteristic.uuid});

        // Before having access to fNIRS data, we need to indicate to the Blueberry that we want to receive this data.
        return server.getPrimaryService(controlService[0].uuid)
            .then(service => {
            console.log('getting service: ', controlService[0].name);
            return service.getCharacteristic(commandChar[0].uuid);
        })
        .then(_ => {
            let fnirsService = requestedServices.filter((service) => {return service.uuid == services.fnirsService.uuid});

            if(fnirsService.length > 0){
            console.log('getting service: ', fnirsService[0].name);
            this.getfNIRSLongData(fnirsService[0], characteristics.fnirsLongCharacteristic, server);
            this.getfNIRSShortData(fnirsService[0], characteristics.fnirsShortCharacteristic, server);
            }
        })
        .catch(error =>{
            console.log('error: ', error);
        })
    }

    getfNIRSLongData(service, characteristic, server){
        return server.getPrimaryService(service.uuid)
            .then(newServiceLong => {
                console.log('getting characteristic: ', characteristic.name);
                return newServiceLong.getCharacteristic(characteristic.uuid)
            })
        .then(char => {
            char.startNotifications().then(res => {
                char.addEventListener('characteristicvaluechanged', this.handlefNIRSLongDataChanged.bind(this));
                })
        })
    }

    getfNIRSShortData(service, characteristic, server){
        return server.getPrimaryService(service.uuid)
            .then(newServiceShort => {
                console.log('getting characteristic: ', characteristic.name);
                return newServiceShort.getCharacteristic(characteristic.uuid)
        })
        .then(char => {
            char.startNotifications().then(res => {
                char.addEventListener('characteristicvaluechanged', this.handlefNIRSShortDataChanged.bind(this));
            })
        })
    }

    handlefNIRSLongDataChanged(event){
        let raw_fnirs_data = event.target.value;

        this.bbyData.receiveFnirs(raw_fnirs_data, true); //true because long path
    }

    handlefNIRSShortDataChanged(event){
        let raw_fnirs_data = event.target.value;
        this.bbyData.receiveFnirs(raw_fnirs_data, false); //false because short path
    }


    saveData(){
        this.bbyData.saveData();
    }

    saveEvent(event_name){
        this.bbyData.saveEvent(event_name);
    }

    clearData(){
        this.bbyData.clearData();
    }

    getData(data_name){
        return this.bbyData.getData(data_name);
    }

    time(text) {
      console.log('[' + new Date().toJSON().substr(11, 8) + '] ' + text);
    }
}

export default BlueberryDevice;
