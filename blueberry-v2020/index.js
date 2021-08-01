window.onload = function(){
  let buttonConnectA = document.getElementById("connectA");
  let message = document.getElementById("message");
  let chartA = document.getElementById("chartA");
  let chartB = document.getElementById("chartB");
  let chartC = document.getElementById("chartC");

  var timeA = 0;
  var timeB = 0;
  var timeC = 0;
  var lastDataA = 0.0;
  var lastDataB = 0.0;
  var lastDataC = 0.0;
  var l1PathMA = [];
  var l2PathMA = [];
  var l3PathMA = [];
  var dataA={labels: [],dataset: []};
  var dataB={labels: [],dataset: []};
  var dataC={labels: [],dataset: []};
  
  //Empty Dataset for start
  var blueberryControllerA = new BlueberryWebBluetoothA("blueberry-0A0C");

  if ( 'bluetooth' in navigator === false ) {
      button.style.display = 'none';
      message.innerHTML = 'This browser doesn\'t support the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API" target="_blank">Web Bluetooth API</a> :(';
  }

  let fnirsDataA;

	var initialised = false;
	var timeout = null;
  var dataCountA = 0;
  var dataCountB = 0;
  var dataCountC = 0;

  buttonConnectA.onclick = function(e){
    //need to put exact device name here
    blueberryControllerA.connect();

    blueberryControllerA.onStateChange(function(state){

      fNIRSDataA = stateA.fNIRS;
      
      displayDataA();

    });
  }

  function average(data){
    var totalSum = 0.0
    var totalCount = data.length
    var average = 0.0

    for (var i = 0; i < totalCount - 1; i++) {
     totalSum += data[i]
     // more statements
    } 

    average = totalSum/totalCount;

    return average;

  }

  function displayDataA(){
    
    if(fNIRSDataA){

      dataCountA += 1;

      //update 5 times a second from 100Hz Sample Rate
      if (dataCountA % 1 == 0){

          //calculate moving average
          if (l1PathMA.length != 10) {
            l1PathMA.push(fNIRSDataA.L1);
            l2PathMA.push(fNIRSDataA.L2);
            l3PathMA.push(fNIRSDataA.L3);
          } else {
            l1PathMA.shift();
            l2PathMA.shift();
            l3PathMA.shift();
            l1PathMA.push(fNIRSDataA.L1);
            l2PathMA.push(fNIRSDataA.L2);
            l3PathMA.push(fNIRSDataA.L3);
          }

          let l1PathMAVal = average(l1PathMA);
          let l2PathMAVal = average(l2PathMA);
          let l3PathMAVal = average(l3PathMA);

          //update chart
          var date = new Date();
          let hour  = date.getHours();  if(hour<10){  hour= '0'+hour; }
          let minutes = date.getMinutes();  if(minutes<10){ minutes=  '0'+minutes;  }
          let seconds = date.getSeconds();  if(seconds<10){ seconds=  '0'+seconds;  }
          timeA  = hour+':'+minutes+':'+seconds;            // H:m:s

          // if (Math.abs(lastDataA - fNIRSDataA.HBT) <= 1000){

            if (dataA.dataset.length != 100) {
              dataA.dataset.push(l1PathMAVal);           //Then remove the first and add a new
              dataB.dataset.push(l2PathMAVal);           //Then remove the first and add a new
              dataC.dataset.push(l3PathMAVal);           //Then remove the first and add a new
              
              dataA.labels.push(timeA);
              dataB.labels.push(timeA);
              dataC.labels.push(timeA);
            } else {

              dataA.dataset.shift();
              dataB.dataset.shift();
              dataC.dataset.shift();
              //data.dataset[1].shift();
              dataA.labels.shift(); 
              dataB.labels.shift(); 
              dataC.labels.shift(); 

              dataA.dataset.push(l1PathMAVal);           //Then remove the first and add a new
              dataB.dataset.push(l2PathMAVal);          //Then remove the first and add a new
              dataC.dataset.push(l3PathMAVal);           //Then remove the first and add a new

              dataA.labels.push(timeA);
              dataB.labels.push(timeA);
              dataC.labels.push(timeA);
            }

            if (dataCountA % 50 ==0){
              drawA(dataA);
              drawB(dataB);
              drawC(dataC);
              dataCountA = 0
            }          
          // } 

      }

      
      
    }

  }

}
