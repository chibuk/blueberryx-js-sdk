/*
Live chart of raw data to visualize signal quality

Really simple right now - don't listen for anything, just pull the latest data from localStorage every n milliseconds and plot it

Blueberry, cayden
*/

import React, { Component } from "react";

import {Line} from 'react-chartjs-2'

class LiveChart extends Component{
    constructor(props) {
        super(props);
        this.state = {
            path : "880nm_850nm_27mm",
            update_period_millis : 10,
            chart_time_millis: 30000, //how long to chart for
            height: 600,
            width: 1000,
            chart_data_obj : {
                labels : [],
                datasets: [
                    {
                    label: "880nm_850nm_27mm",
                    fill: false,
                    lineTension: 0.2,
                    pointRadius: 0.1,
                    responsive: true,
                    maintainAspectRatio: false,
                    backgroundColor: 'rgba(75,192,192,1)',
                    borderColor: 'rgba(0,0,0,1)',
                    borderWidth: 0.3,
                    data: [],
                    colors: [],
                    },
                ]
            }
        }

        this.updateData = this.updateData.bind(this);

    }

    componentDidMount(){
       this.updateData();
       this.interval = setInterval(this.updateData, this.state.update_period_millis);
    }

    updateData(){
        //todo enable user to select and charge desired path 
        var chart_data_obj = {...this.state.chart_data_obj}
        var start_idx = (this.state.chart_time_millis/1000) * this.props.sf;
        var new_data = this.props.blueberryDevice.getData(this.state.path).slice(-start_idx);
        chart_data_obj.labels = new_data;
        chart_data_obj.datasets[0].data = new_data;
        this.setState( {chart_data_obj} );
    }

    render() {
        return (
                <Line
                data={this.state.chart_data_obj}
                options={{
                    title:{
                        display: false,
                        text: "Live Data",
                        fontSize: 16,
                        fontColor: 'rgba(0,0,0,1)',
                        padding: 0,
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    height: 600,
                    width: 1000,
                    scales: {
                        yAxes : [{
                        scaleLabel: {
                        display: true,
                        labelString: "880nm_850nm_27mm",
                        maxTicksLimit: 7,
                        }
                        }],
                        xAxes: [{
                        ticks: {
                        maxTicksLimit: 6,
                        autoSkip: true,
                        display: false,
                        maxRotation: 0,
                        minRotation: 0
                        }
                    }],
                    },
                    animation: {
                        duration: 0
                        },
                        legend:{
                        display: false,
                    },

                }}
            />
        )
    }
}

export default LiveChart;
