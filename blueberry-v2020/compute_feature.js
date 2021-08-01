//compute_feature.js
//https://github.com/dntj/jsfft/blob/master/example/index.js

//low frequence fft
//phase computation

var s2PathMA = [];
var l2PathMA = [];

var _thislowFreq;
var computeComp = {};

class ComputeFeatures{

    triang_win(width,center=0.5){
	    let win = []
	    let cpos = center * width
	    for (var i = 0; i < (width+1) - 1; i++) {
	        if (i <= cpos){
	            win.append(1.0 / cpos * i)
	        } else {
	            win.append(float(width - i) / (width - cpos))
	        }
	    }
	    return win
	}
  	//todo bring in FFT library to compute
	computeLowFreqFFT(data){

	    let valLowFreq = 0.0
	    console.log(valLowFreq);
	    
	   	let num_bands = 10
		let rate = 10
		
		if (len(data)%2==0){
			band_width = (len(data)+2)/(num_bands+1)
		} else {
			band_width = (len(data)+1)/(num_bands+1)
		}

		if (len(data)%2==0){
			spectrum = fft(data)[0:len(data)/2+1]
		} else {
			spectrum = fft(data)[0:(len(data)-1)/2+1]
		}
			
		let linear_step = rate/2/num_bands
		let linear_center = [0.0]+list(map(lambda i:(i+0.5)*linear_step,range(num_bands)))+[rate/2]
		let banks = []
		if (len(data)%2==0){
			freq_unit = rate/(len(data)+2)
		} else {
			freq_unit = rate/(len(data)+1)
		}

		for (var i = 0; i < num_bands - 1; i++) {
			length = linear_center[i+2]-linear_center[i]
			center = (linear_center[i+1]-linear_center[i])/length
			win_size = int(length/freq_unit)
			banks.append(triang_win(win_size,center))
		}

		energy = []
		for i in range(num_bands):
			start = int(linear_center[i]/freq_unit)
			energy.append(sum(list(map(lambda x:np.power(np.abs(x),2),spectrum[start:start + len(banks[i])] * banks[i]))))

		//last bin
		valLowFreq = energy[9]
	    computeComp = {
	      lowFreq: valLowFreq
	    }

	    _thislowFreq.onStateChangeCallback(computeComp);
	}

  	computePhase(data_short, data_long){

	  	let peakPosShort = 0
	  	let peakPosLong = 0
	  	let shift_buff = 2

	  	for (var i = shift_buff; i < len(data_short) - shift_buff; i++) {
	  		if (data_short[i - shift_buff] < data_short[i] && data_short[i] > data_short[i + shift_buff]){
	  			peakPosShort = i
	  			break
	  		}
		}


		for (var i = shift_buff; i < len(data_short) - 1; i++) {
	  		if (data_long[i - shift_buff] < data_long[i] && data_long[i] > data_long[i + shift_buff]){
	  			peakPosLong = i
	  			break
	  		}
		}

		let valPhaseDiff = peakPosShort - peakPosLong

		//if phaseDiff is closer to 0 then peaks from short and long path are in phase for surface and deep tissue blood flow
		//if phaseDiff = 5 are 90 degrees out of phase
		//if phaseDiff = 10 are 180 degrees out of phase
		//should be computed with 100Hz or greater sample rate
		//can work at 10Hz, low res

	    computeComp = {
	      phaseDiff: valPhaseDiff
	    }
		_thisPhaseDiff.onStateChangeCallback(computeComp);

  	}

}

