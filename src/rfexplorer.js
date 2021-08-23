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

    const parser = sPort.pipe(new Readline({ delimiter: '\r\n' }));
    parser.on('data', this.newData);
  }
  newData(event) {
    console.log(event);
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

  sendData( command) {
    let byteArray = new Uint8Array(command.length + 2);
    byteArray[0] = 0x23; // #
    byteArray[1] = command.length + 2;
    for ( var i = 0; i < command.length; i++) {
      byteArray[i+2] = command.charCodeAt(i);
      }
    sPort.write(byteArray, function (err) {
      if (err) {
        console.log("Write error");
      }
    });
    }
}

module.exports = rfExplorerSerial;

