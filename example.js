var isEmulate = true;// for real usage please set false

var CRT_288_K001 = require('./index');
var CardReader = new CRT_288_K001(isEmulate);
CardReader.on('log', function (log) {
    console.log('log: ', log);
});

var async = require('async');
var readlineSync = require('readline-sync');
async.series([
    function (callback) {
        readlineSync.question('getSysVersion?');
        CardReader.getSysVersion(function (err, res) {
            console.log('getSysVersion finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cardStatus?');
        CardReader.cardStatus(function (err, res) {
            console.log('cardStatus finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('lockCard?');
        CardReader.lockCard(function (err, res) {
            console.log('lockCard finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cardStatus?');
        CardReader.cardStatus(function (err, res) {
            console.log('cardStatus finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('unlockCard?');
        CardReader.unlockCard(function (err, res) {
            console.log('unlockCard finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cardStatus?');
        CardReader.cardStatus(function (err, res) {
            console.log('cardStatus finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('readCard?');
        CardReader.readCard(function (err, res) {
            console.log('readCard finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cardStatus?');
        CardReader.cardStatus(function (err, res) {
            console.log('cardStatus finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('readCard?');
        CardReader.readCard(function (err, res) {
            console.log('readCard finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cardStatus?');
        CardReader.cardStatus(function (err, res) {
            console.log('cardStatus finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('clearBuffer?');
        CardReader.clearBuffer(function (err, res) {
            console.log('clearBuffer finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cardStatus?');
        CardReader.cardStatus(function (err, res) {
            console.log('cardStatus finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('readCard?');
        CardReader.readCard(function (err, res) {
            console.log('readCard finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cardStatus?');
        CardReader.cardStatus(function (err, res) {
            console.log('cardStatus finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('readTrackPullOut?');
        CardReader.readTrackPullOut(function (err, res) {
            console.log('readTrackPullOut finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cardStatus?');
        CardReader.cardStatus(function (err, res) {
            console.log('cardStatus finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('readCard?');
        CardReader.readCard(function (err, res) {
            console.log('readCard finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cancelReadTrack without start readTrackPullOut?');
        CardReader.cancelReadTrack(function (err, res) {
            console.log('cancelReadTrack finish', err, res);
            callback();
        });
    },
    function (callback) {
        readlineSync.question('cancelReadTrack with start readTrackPullOut?');
        CardReader.readTrackPullOut(function (err, res) {
            console.log('readTrackPullOut callback', err, res);
        });
        CardReader.cancelReadTrack(function (err, res) {
            console.log('cancelReadTrack finish', err, res);
            callback();
        });
    }
], function (err) {
    console.log('SCRIPT FINISHED', err);
});