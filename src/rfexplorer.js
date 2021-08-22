const serialPort = require('serialport');
const Readline = serialPort.parsers.Readline;
let sPort = null;

//initialize serialport with 115200 baudrate.
// var sp = new serialPort('/dev/ttyUSB0', {
//     baudRate: 115200,
// });
class rfExplorerSerial {
  constructor() {
  }

  listPorts(callback) {
    serialPort.list().then(function (ports) {
      // console.log(ports[0]);
      callback(ports);
    });
  }

  connect(port) {
    console.log("port: " + port);
    sPort = new serialPort(port, {
      baudRate: 500000,
    })
  }

  requestConfig() {
    this.sendData("C0");
  }

  requestHold() {
    this.sendData("CH");
  }

  analyzerConfig(startFreq, endFreq, ampTop, ampBottom) {
    let outString = "C2-F:" + startFreq.toString().padStart(7, '0') + ",";
    outString +=  endFreq.toString().padStart(7, '0') + ",";
    outString += ampTop.toString().padStart(4, '0') + ",";
    outString += ampBottom.toString().padStart(4, '0');
    this.sendData(outString);
  }

  testIPC() {
    console.log("test");
  }

  sendData(aString) {
    let outString = "#";
    outString += aString.length + 2; // does this go wrong if the length is longer ?
    outString += aString;
    sPort.write(outString, function (err) {
      if (err) {
        console.log("Write error");
      }
    });
  }
}

module.exports = rfExplorerSerial;

