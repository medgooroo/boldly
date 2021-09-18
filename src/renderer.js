window.api.receive("portList", (pList) => { // 
  let x = document.getElementById("portList");
  x.length = 0;
  pList.forEach(function (pList) {
    //    for (let [key, value] of data.entries()) {
    var option = document.createElement("option");
    option.text = pList.path
    x.add(option);
  })
});

window.api.receive("sweepData", (sweep) => {
  data = sweep;
})

window.api.receive("explorerConfig", (config) => {
  freqLower = config.startFreq;
  freqUpper = freqLower + (config.freqStep * config.sweepPoints);
  maxDbm = config.ampTop;
  minDbm = config.ampBottom;
  freqResolution = config.freqStep;
  bins = config.sweepPoints;
})


window.api.send("rfExp", ["dosomething"]);


document.getElementById("openPort").addEventListener("click", function () {
  let e = document.getElementById("portList");
  let port = e.options[e.selectedIndex].text;
  window.api.send("rfExp", ["connect", port]);
});

// document.getElementById("reboot").addEventListener("click", function () {
//   window.api.send("rfExp", ["reboot"]);
// });

// document.getElementById("getSerial").addEventListener("click", function () {
//   window.api.send("rfExp", ["getSerial"]);
// });

// document.getElementById("getConfig").addEventListener("click", function () {
//   window.api.send("rfExp", ["getConfig"]);
// });
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 
if we're measure broadband state:
  find any new peaks.  - i.e. broadbandData exceeds broadbandPeaks[]
    if so - 
      for each new peak, mark narrowband as needing updating // how do we map broadband freqs to detailBands?
      detailBands[] ? { startFreq, endFreq, needsUpdate }
    our freq config should be continuously updated from the config callback.
    
do we build a list of dataPoints freq and peak value? doesn't really need to be ordered. - maybe for export?
 
*/
// processing data

let resolution = 0.125; // from ui // presumably like 12.5kHz
let explorerBins = 32; // number of bins recieved form explorer

let currFreqUpper = 0;
let currFreqLower = 0;

let minDbm = -110;
let maxDbm = 0;
let narrowBand = [];
let broadband = {
  "lowerFreq": 6,
  "upperFreq": 63,
  "peakValues": [],
  "narrowBandIndex": [], // same size as peak values, hold index for appropriate narrowband?
}
let data = [];


function setupBands() {
  let range = broadbandFreqUpper - broadbandFreqLower;
  let totalBins = Math.ceil(range / resolution);
  let binsPerBand = 32; // don't know the answer to this. how many data points do we get from explorer?
  let numBands = totalBins / binsPerBand;
  let binBandwidth = range / totalBins;

  for (var i = 0; i < numBands; i++) {
    let lowerFreq = broadbandFreqLower + (i * binsPerBand * binBandwidth);
    let upperFreq = broadbandFreqLower + ((i + 1) * binsPerBand * binBandwidth); // ^^
    let aBand = {
      "lowerFreq": Number.parseFloat(lowerFreq.toFixed(3)), // realllllly?
      "upperFreq": Number.parseFloat(upperFreq.toFixed(3)),
      "peakValues": [],
      "needsUpdate": false,
    }
    narrowBand.push(aBand);
    for (var n = 0; n < binsPerBand; n++) {
      narrowBand[i].peakValues[n] = minDbm;
    }
  }
}

function processData() {
  if ((currFreqUpper == broadbandFreqUpper) && (currFreqLower == broadbandFreqLower)) {    // we're in  broadband state
    for (let i = 0; i < currBins; i++) {
      if (data[i] >= broadband[i].peakValue) {
        broadband[i].peakValue = data[i]; // update broadband peaks
        narrowbands[broadbands[i].narrowBandIndex].needsUpdate = true;
      }
    }
  }

  for (var i = 0; i < narrowBands.length; i++) { // I guess this updates the highest freq first
    if (narrowBand[i].needsUpdate) {
      setExplorerConfig(narrowBand[i].lowerFreq, narrowBand[i].upperFreq);
    }
    if ((currFreqLower == narrowBand[i].lowerFreq) && (currFreqUpper == narrowBand[i].upperFreq)) { // we're in a narrowband
      for (var n = 0; n < data.length; n++) {
        if (narrowBand[i].peakValues[n] <= data[n]) narrowBand[i].peakValues[n] = data[n]; // update peaks
      }
      narrowBand[i].needsUpdate = false;  // updated, remove flag
      setExplorerConfig(broadbandFreqLower, broadbandFreqUpper); // back to broadband
    }

  }
}

function setExplorerConfig(startFreq, endFreq) {
 // window.api.send("rfExp", ["changeConfig", startFreq, endFreq]);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let broadbandFreqLower = 0;
let broadbandFreqUpper = 1000;



var c = document.getElementById("analyser");
var ctx = document.getElementById("analyser").getContext("2d");
ctx.canvas.width = 800;
ctx.canvas.height = 400;

c.addEventListener('mousemove', event => {
  let bound = c.getBoundingClientRect();
  mouseX = event.clientX - bound.left - c.clientLeft;
});


setupBands();
window.requestAnimationFrame(draw);


function draw() {



  drawAnalyser();
  drawPeaks();
  //drawSpectro();
  let fps = 60;
  setTimeout(() => {
    requestAnimationFrame(draw);
  }, 1000 / fps)

}



function setupBands() {
  // set up narrowBands
  let range = broadband.upperFreq - broadband.lowerFreq;
  let totalBins = Math.ceil(range / resolution);
  let numBands = totalBins / explorerBins;
  let binBandwidth = range / totalBins;

  setExplorerConfig(broadband.lowerFreq, broadband.upperFreq);

  for (var i = 0; i < numBands; i++) {
    let lowerFreq = broadband.lowerFreq + (i * explorerBins * binBandwidth);
    let upperFreq = broadband.lowerFreq + ((i + 1) * explorerBins * binBandwidth); // ^^
    let aBand = {
      "lowerFreq": Number.parseFloat(lowerFreq.toFixed(3)), // realllllly?
      "upperFreq": Number.parseFloat(upperFreq.toFixed(3)),
      "peakValues": [],
      "binFreq": [], // yeah we could totally calculate this each time but meh.
      "needsUpdate": false
    }
    narrowBand.push(aBand);
    for (var n = 0; n < explorerBins; n++) {
      narrowBand[i].peakValues[n] = minDbm;
      narrowBand[i].binFreq[n] = (((upperFreq - lowerFreq) / explorerBins) * n) + lowerFreq;
    }
  }
  // set up broadband
  let broadbandBinWidth = (broadband.upperFreq - broadband.lowerFreq) / explorerBins;
  for (var n = 0; n < explorerBins; n++) {
    broadband.peakValues[n] = minDbm;
    for (var m = 0; m < narrowBand.length; m++) {
      if (((n * broadbandBinWidth) + broadband.lowerFreq) >= narrowBand[m].lowerFreq) { // sets index to match appropriate narrowband
        broadband.narrowBandIndex[n] = m;
      }
    }
  }

  console.log(broadband);
  console.log(narrowBand);
}


function processDataOrSomething() {

  if ((currFreqUpper == broadband.upperFreq) && (currFreqLower == broadband.lowerFreq)) { // we're in  broadband state
    for (let i = 0; i < explorerBins; i++) { // bins is curr
      if (data[i] >= broadband.peakValues[i]) {
        broadband.peakValues[i] = data[i]; // update broadband peaks
        narrowBand[broadband.narrowBandIndex[i]].needsUpdate = true;
      }
    }
  }

  for (var i = 0; i < narrowBand.length; i++) { // I guess this updates the highest freq first
    if (narrowBand[i].needsUpdate) {
      setExplorerConfig(narrowBand[i].lowerFreq, narrowBand[i].upperFreq);
    }
    if ((currFreqLower == narrowBand[i].lowerFreq) && (currFreqUpper == narrowBand[i].upperFreq)) { // we're in a narrowband
      for (var n = 0; n < data.length; n++) {
        if (narrowBand[i].peakValues[n] <= data[n]) narrowBand[i].peakValues[n] = data[n]; // update peaks
      }
      narrowBand[i].needsUpdate = false; // updated, remove flag
      setExplorerConfig(broadband.lowerFreq, broadband.upperFreq); // back to broadband
    }
  }
}

let mouseX = 0;

document.getElementById("analyser").addEventListener('mousemove', event => {
  let bound = document.getElementById("analyser").getBoundingClientRect();
  mouseX = event.clientX - bound.left - document.getElementById("analyser").clientLeft;
});



function drawAnalyser() {
  var c = document.getElementById("analyser");
  var ctx = document.getElementById("analyser").getContext("2d");

  let graphHeight = c.height;
  let graphWidth = c.width;

  ctx.clearRect(0, 0, graphWidth, graphHeight);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, graphWidth, graphHeight);

  let vertScale = graphHeight / (maxDbm - minDbm) * -1; // coords are from top 
  // let horizScale = graphWidth / ((freqUpper - freqLower) / freqResolution);
  let totalBins = explorerBins * narrowBand.length;

  ctx.font = '48px serif';
  ctx.textAlign = "right";
  let currMouseFreq = (mouseX / (graphWidth / (broadband.upperFreq - broadband.lowerFreq))) + broadband.lowerFreq;
  let freqText = (currMouseFreq / 1000).toFixed(3) + "MHz";
  ctx.fillStyle = ("#FFFFFF");
  ctx.fillText(freqText, graphWidth, 48);
  ctx.fillRect(mouseX, 0, 2, graphHeight);

  // this should all be just draw this data between these freqs.
  //console.log("drawing: " + currFreqLower + "  " + currFreqUpper);
  let currRange = currFreqUpper - currFreqLower;
  let broadbandRange = broadband.upperFreq - broadband.lowerFreq;
  let bandScale = currRange / broadbandRange;
  let bandOffset = currFreqLower - broadband.lowerFreq;
  let horizOffset = bandOffset / (broadbandRange) * graphWidth;

  //console.log("bandScale: " + bandScale)
  let horizScale = graphWidth / explorerBins * bandScale;

  for (let i = 0; i < data.length; i++) {
    ctx.beginPath();
    //ctx.moveTo((i - 1) * horizScale, data[i - 1] * vertScale);
    ctx.lineWidth = graphWidth / data.length;
    ctx.strokeStyle = heatMapColorforValue(data[i]);
    ctx.moveTo((i * horizScale) + horizOffset, graphHeight);
    ctx.lineTo((i * horizScale) + horizOffset, data[i] * vertScale);
    ctx.stroke();
  }
}



function drawPeaks() {
  var c = document.getElementById("analyser");
  var ctx = document.getElementById("analyser").getContext("2d");

  let graphHeight = c.height;
  let graphWidth = c.width;

  let vertScale = graphHeight / (maxDbm - minDbm) * -1; // coords are from top 
  // let horizScale = graphWidth / ((freqUpper - freqLower) / freqResolution);
  let totalBins = explorerBins * narrowBand.length;

  // this should all be just draw this data between these freqs.
  // console.log("drawing peaks");

  let horizScale = graphWidth / totalBins;
  /*   console.log("band Length: " + narrowBand[0].peakValues.length);
    console.log("xplorerBins: " + explorerBins); */

  for (let i = 0; i < narrowBand.length; i++) {
    for (let j = 1; j < narrowBand[i].peakValues.length; j++) {

      ctx.beginPath();
      //ctx.moveTo((i - 1) * horizScale, data[i - 1] * vertScale);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'red';
      ctx.moveTo(((i * explorerBins + j) * horizScale), narrowBand[i].peakValues[j - 1] * vertScale);
      ctx.lineTo(((i * explorerBins + j) * horizScale), narrowBand[i].peakValues[j] * vertScale);
      ctx.stroke();
    }
  }
}


function dumpPeaks() {
  for (let i = 0; i < narrowBand.length; i++) {
    for (let j = 0; j < narrowBand[i].peakValues.length; j++) {
      //      console.log(narrowBand[i].binFreq[j] + " : " + narrowBand[i].peakValues[j]);

    }
  }
  setTimeout(() => {
    dumpPeaks();
  }, 5000)
}


function heatMapColorforValue(value) {
  value = value / -(maxDbm - minDbm);
  var h = (value) * 240
  return "hsl(" + h + ", 100%, 50%)";
}
