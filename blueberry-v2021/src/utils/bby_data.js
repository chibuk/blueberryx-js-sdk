//
//This receives raw data fNIRS packets, parses them, aligns short and long data streams, receives event tags, and put it all into one data structure to be exported to CSV
//
//Holds the data for a single data collection session.
//
//We hold raw data packets for long and short path in local buffers until the matching packet (i.e. the short packet that is from the same sample as the long packet) are found, they are then added to arrays which are saved in localStorage
//
//Blueberry, cayden, jdc
//
import * as dfd from "danfojs/src/index";
import * as slayer from "slayer/index";
import * as mathjs from "mathjs";
import * as Fili from "fili";

class BlueberryData {
    constructor(){
        this.sf = 25;

        //6 samples per packet, 14 bytes per sample
        this.sample_size = 14;
        this.samples = 6;

        //hold events that are sent to use by the running experiment
        this.events = [];

        //record the system hardware's latency
        this.meanLatency = null;

        //final_data shape
        this.final_data = {
            "timestamps" : [],
            "packet_idx" : [],
            "740nm_27mm": [],
            "880nm_27mm": [],
            "880nm_850nm_27mm": [],
            "740nm_10mm": [],
            "880nm_10mm": [],
            "880nm_850nm_10mm": [],
            "events": [],
        }
        this.resample_stop = 0; //remember how far into the final data object we have already resampled timestamps, should always be a multiple of 6

        //we hold data first in memory, and then align data and push off to localStorage once every 30 seconds
        this.sample_counter = 0;
        this.sample_counter_max = this.sf * 0.25;
        this.time_thresh = 4 * this.sample_counter_max; //number of seconds before we drop old packets

        //long data holders
        this.long_data_obj = {
            "timestamps" : [],
            "sample_indices" : [],
            "packet_indices" : [],
            "c1": [],
            "c2": [],
            "c3": [],
        };

        //short data holders
        this.short_data_obj = {
            "timestamps" : [],
            "sample_indices" : [],
            "packet_indices" : [],
            "c1": [],
            "c2": [],
            "c3": [],
        };

    }

    getData(data_name){
        return this.final_data[data_name];
    }

    receiveFnirs(packet, path){
        //format: index_sample, index_path, data c1, data c2, datac3 - repeat 8x
        //pattern = "uintbe:8,uintbe:8,intbe:32,intbe:32,intbe:32";
        var this_ts = Date.now();
        var offset = 0;
        for (var i = 0; i < this.samples; i++){
            //parse data
            var sample_index = packet.getUint8(0+offset)
            var packet_index = packet.getUint8(1+offset)
            var d1 = packet.getInt32(2+offset);
            var d2 = packet.getInt32(6+offset);
            var d3 = packet.getInt32(10+offset);

            //add to buffers
            var tmp_data_obj;
            if (path){
                tmp_data_obj = this.long_data_obj
            } else {
                tmp_data_obj = this.short_data_obj
            }

            tmp_data_obj["timestamps"].push(this_ts);
            tmp_data_obj["sample_indices"].push(sample_index);
            tmp_data_obj["packet_indices"].push(packet_index);
            tmp_data_obj["c1"].push(d1);
            tmp_data_obj["c2"].push(d2);
            tmp_data_obj["c3"].push(d3);

            //increment offset for next sample
            offset = offset + this.sample_size;

            //increment sample counter
            this.sample_counter++;
        }

        if (this.sample_counter >= this.sample_counter_max){
            this.sample_counter = 0;
            this.alignStoreDump();
            this.dropOldPackets();
        }
//        this.alignStoreDump();
//        this.dropOldPackets();
    }

    alignStoreDump(){
        //align data and push off to localStorage once every 3 seconds
        //
        //lsbuf stands for local storage buffer
//        var lsbuf = {};
//        for (let k in this.final_data_shape){
//            lsbuf[k] = [];
//        }

        //find if packet_indices_{long, short} have any value in common
        var curr_packet_idx;
        var to_drop_short = []; //the indices we process and thus will drop after looping through the data
        var to_drop_long = []; //the indices we process and thus will drop after looping through the data
        for (var i = 0; i < this.long_data_obj["packet_indices"].length; i++){
            //if value in common is found, save the indice of that packet
            var curr_match_short = this.short_data_obj["packet_indices"].indexOf(this.long_data_obj["packet_indices"][i])
            if (curr_match_short != -1){
                var curr_match_long = this.long_data_obj["packet_indices"].indexOf(this.short_data_obj["packet_indices"][curr_match_short])
                to_drop_short.push(curr_match_short);
                to_drop_long.push(curr_match_long);
                //push that onto the buffer which will be added to local storage
                this.final_data["timestamps"].push((this.long_data_obj["timestamps"][curr_match_long] + this.short_data_obj["timestamps"][curr_match_short])/2)
                this.final_data["packet_idx"].push(this.long_data_obj["packet_indices"][curr_match_long])
                this.final_data["740nm_27mm"].push(this.long_data_obj["c1"][curr_match_long])
                this.final_data["880nm_27mm"].push(this.long_data_obj["c2"][curr_match_long])
                this.final_data["880nm_850nm_27mm"].push(this.long_data_obj["c3"][curr_match_long])
                this.final_data["740nm_10mm"].push(this.short_data_obj["c1"][curr_match_short])
                this.final_data["880nm_10mm"].push(this.short_data_obj["c2"][curr_match_short])
                this.final_data["880nm_850nm_10mm"].push(this.short_data_obj["c3"][curr_match_short])
                if (this.events != []){
                    var event_string = "";
                    for (var j = 0; j < this.events.length; j++){
                    event_string = event_string + this.events[j] + ";";
                    }
                    this.events = [];
                    this.final_data["events"].push(event_string)
                } else {
                    this.final_data["events"].push(null)
                }
           }
        }

        //drop those indices from the local buffers
        for (let k in this.long_data_obj){
            for (var j = to_drop_short.length - 1; j >= 0; j--){
                this.short_data_obj[k].splice(to_drop_short[j], 1);
            }
            for (var l = to_drop_long.length - 1; l >= 0; l--){
                this.long_data_obj[k].splice(to_drop_long[l], 1);
            }
        }

        //now re-align timestamps 
        var step = this.samples;
        for (var i = (this.resample_stop + ((2 * step) - 1)); i < (this.final_data["timestamps"].length); i = i + step){
            var ts_a = this.final_data["timestamps"][i - step];
            var ts_b = this.final_data["timestamps"][i];
            var delta = (ts_b - ts_a) / step;
            for (var j = (step - 1); j > 0; j--){
                this.final_data["timestamps"][i - j] -= (delta * j);
            }
        }

        this.resample_stop = (this.final_data["timestamps"].length - step);
        
        //after iterating through all values in packet_indices, append the new values to the corresponding localStorage object
//        var min_len;
//        for (let k in lsbuf){
//            var tmp_arr = localStorage.getItem("bby_"+k);
//            if (tmp_arr == null){
//                tmp_arr = [];
//            } else {
//                tmp_arr = JSON.parse(tmp_arr);
//            }
//            var new_arr = tmp_arr.concat(lsbuf[k]);
//            localStorage.setItem("bby_"+k, JSON.stringify(new_arr));
//        }

    }

    dropOldPackets(){
        //drop packets that are too old and we won't find a match for before packet index wraparound
        var time_now = Date.now();
        for (var i = 0; i < this.long_data_obj.length; i++){
            if ((time_now - this.long_data_obj["timestamps"][i]) > this.time_thresh){
                for (let k in this.long_data_obj){
                    this.long_data_obj[k].splice(i, 1);
                }
            }
        }
        for (var i = 0; i < this.short_data_obj.length; i++){
            if ((time_now - this.short_data_obj["timestamps"][i]) > this.time_thresh){
                for (let k in this.short_data_obj){
                    this.short_data_obj[k].splice(i, 1);
                }
            }
        }
    }

    clearData(){
        //this could be cleaner instead of repeating dict keys again
        this.final_data = {
            "timestamps" : [],
            "packet_idx" : [],
            "740nm_27mm": [],
            "880nm_27mm": [],
            "880nm_850nm_27mm": [],
            "740nm_10mm": [],
            "880nm_10mm": [],
            "880nm_850nm_10mm": [],
            "events": [],
        }

        //long data holders
        this.long_data_obj = {
            "timestamps" : [],
            "sample_indices" : [],
            "packet_indices" : [],
            "c1": [],
            "c2": [],
            "c3": [],
        };

        //short data holders
        this.short_data_obj = {
            "timestamps" : [],
            "sample_indices" : [],
            "packet_indices" : [],
            "c1": [],
            "c2": [],
            "c3": [],
        };

        for (let k in this.final_data){
            localStorage.removeItem("bby_"+k);
        }
    }

    saveEvent(event_name){
        this.events.push(event_name);
    }
    
    saveData(){
        //put data into CSV, user downloads the CSV, flush the data stored in memory upon download completion
        this.createCSV(this.final_data);
    }

    createCSV(data_obj){
        //stick the data in a csv and download it
        var csv = "";
        var df = new dfd.DataFrame(data_obj);
        df.to_csv("blueberry_data.csv").then((csv) => {
            var hiddenElement = document.createElement('a');
            hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            hiddenElement.target = '_blank';
            const timeElapsed = Date.now();
            const today = new Date(timeElapsed);
            var csvTime = today.toISOString(); // "2020-06-13T18:30:00.000Z"
            hiddenElement.download = csvTime + "_blueberry_data.csv";
            hiddenElement.click();
        }).catch((err) => {
            console.log(err);
        })
    }
}

export default BlueberryData;
