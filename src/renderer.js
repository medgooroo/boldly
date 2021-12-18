let bandTime = 3000;

window.api.receive("portList", (pList) => { // 
  let x = document.getElementById("portList");
  x.length = 0;
  pList.forEach(function (pList) {
    let option = document.createElement("option");
    option.text = pList.path
    x.add(option);
  })
});

document.getElementById("openPort").addEventListener("click", function () {
  let e = document.getElementById("portList");
  let port = e.options[e.selectedIndex].text;
  window.api.send("rfExp", ["connect", port]);
  window.api.send("rfExp", ["getConfig"]);
  broadband.startFreq = document.getElementById("startFreq").value * 1000;
  broadband.endFreq = document.getElementById("endFreq").value * 1000;
  broadband.resolution = document.getElementById("resolution").value;
  setupBands();
  setTimeout(changeBand, 1000);

});

document.getElementById("apply").addEventListener("click", function () {
  window.api.send("rfExp", ["getConfig"]);
  broadband.startFreq = document.getElementById("startFreq").value * 1000;
  broadband.endFreq = document.getElementById("endFreq").value * 1000;
  broadband.resolution = document.getElementById("resolution").value;
  setupBands();
});

document.getElementById("dump").addEventListener("click", function () {
  //dumpPeaks();
  window.api.send("ui", ["saveOutput", narrowBand]);
});

window.api.receive("sweepData", (sweep) => {
  // data = sweep;  // shouldnt be like this? - used to draw the current sweep
  processData(sweep);
})


window.api.receive("explorerConfig", (config) => {
  explorerConfig = config;
  explorerConfig.endFreq = explorerConfig.startFreq + (explorerConfig.freqStep * explorerConfig.sweepPoints);
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////
let broadband = {
  "startFreq": 0,
  "endFreq": 0,
  "ampTop": 0,
  "ampBottom": -110,
  "sweepPoints": 0,
  "resolution": 0
}
let explorerConfig = {
  startFreq: 0,
  endFreq: 0,
  freqStep: 0,
  sweepPoints: 0
}; // 
let narrowbandFreqStep; // width for narrows
let widebandFreqStep; // width for wide

let narrowBands = []; // collection of band configs

// set config.
// wait for new explorerConfig
// process new sweep data - do we care if it fits our band setup? 
// the only thing we care about is resolution - we're either narrow or not.

function setupBands() {
  narrowBands = [];
  //setExplorerConfig(broadband.startFreq, broadband.endFreq);

  var graphStyle = {
    xaxis: {
      range: [broadband.startFreq * 1000, broadband.endFreq * 1000]
    },
    yaxis: {
      range: [broadband.ampBottom, broadband.ampTop]
    }
  }

  Plotly.relayout('plot', graphStyle);

  // hmmmmm do we need to wait for config to get back?
  let numBands = (broadband.endFreq - broadband.startFreq) / broadband.resolution;
  console.log("generating " + numBands + " narrowbands");
  for (let i = 0; i < numBands; i++) {
    let lFreq = broadband.startFreq + i * broadband.resolution;
    let uFreq = broadband.startFreq + (i + 1) * broadband.resolution;
    let aBand = {
      "startFreq": Number.parseFloat(lFreq.toFixed(3)),
      "endFreq": Number.parseFloat(uFreq.toFixed(3)),
      "freq": [],
      "mag": [],
      "peakValue": []
    }


    narrowBands.push(aBand);
  }
  setExplorerConfig(narrowBands[0].startFreq, narrowBands[0].endFreq);
}



function changeBand() {
  let narrowBandID = 0;
  while (explorerConfig.startFreq != narrowBands[narrowBandID].startFreq) {
    narrowBandID++;
  }
  narrowBandID++;
  if (narrowBandID >= narrowBands.length) narrowBandID = 0;
  console.log("switching to band: " + narrowBands[narrowBandID].startFreq + " : " + narrowBands[narrowBandID].endFreq);
  setExplorerConfig(narrowBands[narrowBandID].startFreq, narrowBands[narrowBandID].endFreq);
  setTimeout(changeBand, bandTime);
}

function processData(data) {

  // from explorerconfig
  //  current frequency range is from explorerConfg  Hopefully this is up to date, if not we need to be calling get config more?

  // find a narrowBand which has startFreq == explorerConfig 
  let narrowBandID = 0;
  while (explorerConfig.startFreq != narrowBands[narrowBandID].startFreq) {
    narrowBandID++;
  }
  //console.log("in band: " + narrowBandID + " From " + narrowBands[narrowBandID].startFreq + " to " + narrowBands[narrowBandID].endFreq);
  // set the values
  let i = 0;
  for (var band = explorerConfig.startFreq; band < explorerConfig.endFreq; band += explorerConfig.freqStep) {
    narrowBands[narrowBandID].freq[i] = band * 1000;
    narrowBands[narrowBandID].mag[i] = data[i];

    if ((data[i] >= narrowBands[narrowBandID].peakValue[i]) || !(narrowBands[narrowBandID].peakValue[i])) {
      narrowBands[narrowBandID].peakValue[i] = data[i];
    }


    i++;
  }

  requestAnimationFrame(updatePlot)

}

function updatePlot() {
  let currData = {
    freq: [],
    mag: []
  }

  let peakData = {
    freq: [],
    peak: []
  }


  // merge all narrowbands
  for (let i = 0; i < narrowBands.length; i++) {
    currData.freq.push(...narrowBands[i].freq);
    currData.mag.push(...narrowBands[i].mag);
   // peakData.freq.push(...narrowBands[i].freq);
    peakData.peak.push(...narrowBands[i].peakValue);
  }

  var curr = {
    x: currData.freq,
    y: currData.mag,
    type: 'scatter',
    line: {
      color: 'rgb(0,0,255)'
    }
  }
  var peak = {
    x: currData.freq,
    y: peakData.peak,
    type: 'scatter',
    line: {
      color: 'rgb(255,0,0)'
    }
  }

  var data = [peak,curr,peak];
  Plotly.animate('plot', {
    data,
    traces: [0,1]

  }, {

    transition: {
      duration: 0
    },
    frame: {
      duration: 0,
      redraw: false
    }
  });
}

function setExplorerConfig(startFreq, endFreq) {
  window.api.send("rfExp", ["changeConfig", startFreq, endFreq]);
}


thePlot = document.getElementById('plot');
Plotly.newPlot(thePlot, [{
  x: [606000000, 642000000],
  y: [-120, -120]
}], {
  margin: {
    t: 0
  },
  xaxis: {
    range: [606000000, 642000000]
  },
  yaxis: {
    range: [-110, 0]
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////actual rendering things
