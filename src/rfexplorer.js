const serialPort = require('serialport');
//const Readline = serialPort.parsers.Readline;
const Delimiter = serialPort.parsers.Delimiter;
let sPort = null;

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
    const parser = sPort.pipe(new Delimiter({ delimiter: '\r\n' }));
    parser.on('data', this.processNewData.bind(this));
  }

  processSweep(dBuffer) {
    switch (dBuffer.readUInt8(1)) {
      case 0x53: // S sweep data
        console.log("standard sweep data. " + (dBuffer.readUInt8(2) + 1 * 16) + " data points");
        break;
      case 0x73: // s extended sweep data
        console.log("extended sweep data. " + (dBuffer.readUInt8(2) + 1 * 16) + " data points");
        break;
      case 0x7A: // z sweep data Large
        console.log("large sweep data. " + dBuffer.readUInt16(2) + " data points"); // untested
        break;
      default:
        console.log("unknown data");
    }
    let dbmValues = new Array(dBuffer.length);
    for (var i = 3; i < dBuffer.length; i++) { // skip descriptor
      dbmValues[i - 3] = dBuffer.readUInt8(i) / -2;
    }
   // console.log(dbmValues);
    this.callback(dbmValues);
  }

  processNewData(data) {
    switch (data.readUInt8(0)) {
      case 0x23: // # config related
        console.log("config data from rfe");
        break;
      case 0x24: // $ sweep data 
        this.processSweep(data);
      default:
    }
  }
  setReceiveCallback(cb) {
    this.callback = cb;
  }

  requestConfig() {
    this.sendData("C0");
  }

  requestHold() {
    this.sendData("CH");
  }

  analyzerConfig(startFreq, endFreq, ampTop, ampBottom) { // freq in KHz, amp dBm FS
    let outString = "C2-F:" + startFreq.toString().padStart(7, '0') + ",";
    outString += endFreq.toString().padStart(7, '0') + ",";
    outString += ampTop.toString().padStart(4, '0') + ",";
    outString += ampBottom.toString().padStart(4, '0');
    this.sendData(outString);
  }

  // #<Size>C2-F: <Start_Freq>, <End_Freq>, <Amp_Top>, <Amp_Bottom></Amp_Bottom>

  testIPC() {
    console.log("test");
  }

  reboot() {
    console.log("rebooting rfexplorer");
    let outString = "r";
    this.sendData(outString);
  }

  getSerial() {
    console.log("getting serial");
    this.analyzerConfig(500000, 555000, -10, -120);
  }

  sendData(command) {
    let byteArray = new Uint8Array(command.length + 2);
    byteArray[0] = 0x23; // #
    byteArray[1] = command.length + 2;
    for (var i = 0; i < command.length; i++) {
      byteArray[i + 2] = command.charCodeAt(i);
    }
    sPort.write(byteArray, function (err) {
      if (err) {
        console.log("Write error");
      }
    });
  }
}

module.exports = rfExplorerSerial;

