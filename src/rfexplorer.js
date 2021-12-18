const serialPort = require('serialport');
const Delimiter = serialPort.parsers.Delimiter;
let sPort = null;

class rfExplorerSerial {
  constructor() {
    this.sweepCallback = null;
    this.configCallBack = null;
  }

  listPorts(callback) {
    serialPort.list().then(function (ports) {
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
        //   console.log("standard sweep data. " + (dBuffer.readUInt8(2) + 1 * 16) + " data points");
        break;
      case 0x73: // s extended sweep data
        //  console.log("extended sweep data. " + (dBuffer.readUInt8(2) + 1 * 16) + " data points");
        break;
      case 0x7A: // z sweep data Large
        //  console.log("large sweep data. " + dBuffer.readUInt16(2) + " data points"); // untested
        break;
      default:
        console.log("unknown data");
    }
    let dbmValues = new Array(dBuffer.length);
    for (let i = 3; i < dBuffer.length; i++) { // skip descriptor
      dbmValues[i - 3] = dBuffer.readUInt8(i) / -2;
    }
    this.sweepCallback(dbmValues);
  }

  processConfig(dBuffer) {
    if ((dBuffer.readUInt8(1) == 0x43) && (dBuffer.readUInt8(2) == 0x32) && (dBuffer.readUInt8(3) == 0x2D) && (dBuffer.readUInt8(4) == 0x46)) { // C2-F
      let startFreq = this.stringFromData(dBuffer, 6, 7); // in KHz
      let freqStep = this.stringFromData(dBuffer, 14, 7) / 1000;// in KHz
      let ampTop = this.stringFromData(dBuffer, 22, 4);
      let ampBottom = this.stringFromData(dBuffer, 27, 4);
      let sweepPoints = this.stringFromData(dBuffer, 32, 4);

      // 012345 6->13          14-21       22-26        27-31       32-36               33
      // #C2-F:<Start_Freq>, <Freq_Step>, <Amp_Top>, <Amp_Bottom>, <Sweep_points>, <ExpModuleActive>,
      //        34-37          38-45       46-53      54-61     62-67    68-72          73-77       78-81
      //    <CurrentMode>, <Min_Freq>, <Max_Freq>, <Max_Span>, <RBW>, <AmpOffset>, <CalculatorMode> <EOL></EOL>
      //    6-13 = startFreq
      //   console.log("startFreq: " + startFreq);
      this.configCallBack(startFreq, freqStep, ampTop, ampBottom, sweepPoints);
    }
  }

  stringFromData(buff, offset, length) {
    //console.log("buff length: " + buff.length);
    let aString = '';
    for (let i = offset; i < offset + length; i++) {
      aString = aString + String.fromCharCode(buff.readUInt8(i));
    }
    return parseInt(aString, 10);
  }

  processNewData(data) {
    switch (data.readUInt8(0)) {
      case 0x23: // # config related
        this.processConfig(data);
        break;
      case 0x24: // $ sweep data 
        this.processSweep(data);
      default:
    }
  }
  setReceiveCallback(cb) {
    this.sweepCallback = cb;
  }

  requestConfig(cb) {
    this.configCallBack = cb;
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
    for (let i = 0; i < command.length; i++) {
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

