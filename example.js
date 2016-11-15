var isEmulate = true;// for real usage please set false

var CRT_288_K001 = require('./index').CRT_288_K001;
var CRT_288_K001_errors = require('./index').Errors;

var async = require('async');

var keypress = require('keypress');
keypress(process.stdin);
process.stdin.on('keypress', function (ch, key) {
    if (key && key.ctrl && key.name == 'c') {
        process.stdin.pause();
    }
});

function test() {
    let isCancel = false;
    var listener = function (ch, key) {
        if (key && key.name == 'm') {
            isCancel = true;
            CardReader.safeCancelCardRead(function (err, res) {
                console.log('safeCancelCardRead result', err, res);
                test();
            });
        }
    };
    process.stdin.once('keypress', listener);
    console.log('current memory usage', process.memoryUsage());
    console.log('------------------start new iteration--------------------');
    let CardReader = new CRT_288_K001(isEmulate);
    CardReader.on('log', (log) =>console.log('log: ', log));
    CardReader.safeCardRead(function (err, res) {
        console.log('safeCardRead result', err, res);
        if (!isCancel) {
            process.stdin.removeListener('keypress', listener);
            test();
        }
    });
}
test();