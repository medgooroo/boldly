
window.api.receive("portList", (pList) => { // 
  let x = document.getElementById("portList");
  x.length = 0;
  pList.forEach(function (pList) {
    //    for (let [key, value] of data.entries()) {
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
  data = sweep;  // shouldnt be like this? - used to draw the current sweep
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
  "ampBottom": 0,
  "sweepPoints": 0,
  "resolution": 0
}
let explorerConfig; // 
let narrowbandFreqStep; // width for narrows
let widebandFreqStep; // width for wide

let narrowBands = []; // collection of band configs

// set config.
// wait for new explorerConfig
// process new sweep data - do we care if it fits our band setup? 
// the only thing we care about is resolution - we're either narrow or not.

function setupBands() {
  setExplorerConfig(broadband.startFreq, broadband.endFreq);
  // hmmmmm do we need to wait for config to get back?
  let numBands = (broadband.endFreq - broadband.startFreq) / broadband.resolution;
  for (let i = 0; i < numBands; i++) {
    let lFreq = broadband.startFreq + (i * numBands);
    let uFreq = broadband.startFreq + ((i + 1) * numBands);
    let aBand = {
      "startFreq": Number.parseFloat(lFreq.toFixed(3)),
      "endFreq": Number.parseFloat(uFreq.toFixed(3)),
      "peakValues": []
    }
    for (let j = 0; j < broadband.sweepPoints; j++) {
      aBand.peakValues[j] = broadband.ampBottom;
    }
    narrowBands.push(aBand);
  }
}

function processData(data) {
  // from explorerconfig
  let freq = [];
  let mag = [];
  let i = 0;
  for (var band = explorerConfig.startFreq; band < explorerConfig.endFreq; band += explorerConfig.freqStep) {
    freq[i] = band * 1000;
    mag[i] = data[i];
    i++;
  }

  Plotly.animate('plot', {
    data: [{ x: freq, y: mag }]
  }, {
    transition: {
      duration: 0
    },
    frame: {
      duration: 0
    }
  });


}

function setExplorerConfig(startFreq, endFreq) {
  window.api.send("rfExp", ["changeConfig", startFreq, endFreq]);
}


thePlot = document.getElementById('plot');
Plotly.newPlot(thePlot, [{
  x: [606000000, 642000000],
  y: [-120,-120]
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
