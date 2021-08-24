window.api.receive("portList", (data) => { // 
    let x = document.getElementById("portList");
    x.length = 0;
    data.forEach(function (data) {
        //    for (let [key, value] of data.entries()) {
        var option = document.createElement("option");
        option.text = data.path
        x.add(option);
    })
});

window.api.receive("sweepData", (sweep) => {
  data = sweep;
})

console.log("doing something")
window.api.send("rfExp", ["dosomething"]);


document.getElementById("openPort").addEventListener("click", function () {
    let e = document.getElementById("portList");
    let port = e.options[e.selectedIndex].text;
    window.api.send("rfExp", ["connect", port]);
});

document.getElementById("reboot").addEventListener("click", function () {
  window.api.send("rfExp", ["reboot"]);
});

document.getElementById("getSerial").addEventListener("click", function () {
  window.api.send("rfExp", ["getSerial"]);
});

document.getElementById("getConfig").addEventListener("click", function () {
  window.api.send("rfExp", ["getConfig"]);
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let maxDbm = 0;
let minDbm = -110;
let freqLower = 120;
let freqUpper = 232;
let freqResolution = 1;
let currFreq = 0;

var c = document.getElementById("graphCanvas");
var ctx = c.getContext("2d");


let graphHeight = c.height;
let graphWidth = c.width;

let vertScale = graphHeight / (maxDbm - minDbm) * -1; // coords are from top 
let horizScale = graphWidth / ((freqUpper - freqLower) / freqResolution);
let  bins = ( (freqUpper-freqLower) / freqResolution);
let data = [bins];
let mouseX = 0;

for (let i = 0; i < bins; i++) {
	data[i] = Math.random()*-110;
  //console.log()
}

c.addEventListener('mousemove', event => {
  let bound = c.getBoundingClientRect();
  mouseX = event.clientX - bound.left - c.clientLeft;
});


//drawData(data, 0, horizScale, vertScale);
window.requestAnimationFrame(drawData);

function drawData() {
  ctx.clearRect(0, 0, graphWidth, graphHeight);
  ctx.beginPath();
  ctx.font = '48px serif';
  ctx.textAlign = "right";
  currFreq = (mouseX / (graphWidth / (freqUpper - freqLower))) + freqLower;

  ctx.fillText(currFreq.toFixed(2), graphWidth, 48);
  ctx.fillRect(mouseX, 0, 2, graphHeight);
  for (let i = 1; i < data.length; i++) {
  ctx.moveTo((i-1)*horizScale, data[i-1]*vertScale);
  ctx.lineTo(i*horizScale, data[i]*vertScale);
  ctx.stroke();
    //line((i-1)*hScale, data[i-1]*vScale, i*hScale, data[i]*vScale);
  }
  window.requestAnimationFrame(drawData);
};