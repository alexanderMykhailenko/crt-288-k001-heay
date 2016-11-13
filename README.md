# NodeJS module for USB crt-288-k001-heay card reader

### Install:
npm install crt-288-k001-heay

----------

### Example:
Usage example in file **example.js**

----------

### Start using:
    var CRT_288_K001 = require('crt-288-k001-heay');
    var CardReader = new CRT_288_K001(false); //true for emulate real reader
    CardReader.on('log', function (log) {
        console.log('log: ', log);
    });

----------

### Reading card:
    CardReader.readTrackPullOut(function (err, res) {//callback calls after card pull out from reader
        console.log('readTrackPullOut callback', err, res);
    });

----------

### Available methods:
- getSysVersion
- readTrackPullOut
- cancelReadTrack
- lockCard
- unlockCard
- cardStatus
- readCard
- clearBuffer
- execCommand