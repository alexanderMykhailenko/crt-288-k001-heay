var ffi = require('ffi');
var ref = require("ref");
var refArray = require('ref-array');
var EventEmitter = require('events');
var parseCardTrack = require('./parseCardTrack.js');
var async = require('async');

const dllConfig = {
    'GetSysVerion': ['int', [ref.refType('string')]],
    'CRT288KUOpen': ['pointer', []],
    'CRT288KUClose': ['int', ['pointer']],
    'USB_ExeCommand': ['int', [
        'pointer',//HANDLE ComHandle
        'byte',//BYTE TxCmCode
        'byte',//BYTE TxPmCode
        'int',//int TxDataLen
        refArray(ref.types.byte),//BYTE TxData[]
        ref.refType('byte'),//BYTE *RxReplyType
        ref.refType('byte'),//BYTE *RxStCode1
        ref.refType('byte'),//BYTE *RxStCode0
        ref.refType('int'),//int *RxDataLen
        refArray(ref.types.byte)//BYTE RxData[]
    ]],
    'USB_UpTrackData': ['int', [
        'pointer',//HANDLE ComHandle
        'byte',//BYTE tracks
        'byte',//BYTE ReadMode
        'byte',//BYTE _WaitTime
        refArray(ref.types.byte),//BYTE *RxReplyType
        ref.refType('int'),//int *_CardDataLen
        refArray(ref.types.byte)//BYTE _CardData[]
    ]],
    'USB_Cancel_UpTrackData': ['int', ['pointer']]
};

const Errors = {
    internal_error: "Internal error",
    parameter_error: "Parameter Error",
    upload_error_data: "Upload error data",
    upload_timeout: "Upload timeout",
    upload_cancel: "Upload cancel",
    execution_error: "Execution error"
};

class CRT_288_K001 extends EventEmitter {
    constructor(emulateRealDevice = false) {
        super();
        this.isEmulated = emulateRealDevice;

        if (this.isEmulated) {
            this.ComHandle = null;
        } else {
            this.libm = ffi.Library('CRT_288_K001.dll', dllConfig);
            this.ComHandle = this.libm.CRT288KUOpen();
        }
    }

    safeCardRead(callback) {
        this._emitError('info', 'Start safeCardRead');
        var res;
        async.series([
            (cb)=> setTimeout(()=> cb(), 10),
            (cb)=> {
                this._clearBuffer((err)=> {
                    cb(err);
                });
            },
            (cb)=> setTimeout(()=> cb(), 10),
            (cb)=> {
                this._readTrackPullOut((err, cardData)=> {
                    if (err) {
                        cb(err);
                    } else {
                        res = cardData;
                        cb();
                    }
                });
            },
            (cb)=> setTimeout(()=> cb(), 10),
            (cb)=> {
                if (this.ComHandle) {//clear buffer if connection not closed
                    this._clearBuffer((err)=> {
                        cb(err);
                    });
                } else {
                    cb();
                }
            }
        ], (err)=> {
            if (err && err !== Errors.upload_cancel && err !== Errors.upload_timeout) {
                this._emitError('error', 'FINISH safeCardRead', err);
            } else {
                this._emitError('info', 'FINISH safeCardRead', err);
            }
            this._closeComHandle();
            if (err) {
                callback(err);
            } else {
                callback(null, res);
            }
        });
    }

    safeCancelCardRead(callback) {
        this._emitError('info', 'Start safeCancelCardRead');
        var res;
        async.series([
            (cb)=> setTimeout(()=> cb(), 1000),//min 700
            (cb)=> {
                this._cancelReadTrack((err, cancelStatus)=> {
                    if (err) {
                        cb(err);
                    } else {
                        res = cancelStatus;
                        cb();
                    }
                });
            },
            (cb)=> setTimeout(()=> cb(), 1000),//min 700
            (cb)=> {
                if (this.ComHandle) {//clear buffer if connection not closed
                    this._clearBuffer((err)=> {
                        cb(err);
                    });
                } else {
                    cb();
                }
            }
        ], (err)=> {
            if (err) {
                this._emitError('error', 'FINISH safeCancelCardRead', err);
            } else {
                this._emitError('info', 'FINISH safeCancelCardRead', err);
            }
            this._closeComHandle();
            if (err) {
                callback(err);
            } else {
                callback(null, res);
            }
        });
    }

    _closeComHandle() {
        if (this.ComHandle) {//probably it's closed before
            this.libm.CRT288KUClose(this.ComHandle);//Bad_CommClose -105
        }
        this.ComHandle = null;
    }

    _readTrackPullOut(callback) {
        if (this.isEmulated) {
            setTimeout(()=> {
                let data = 'B4242424242424242^TESTLAST/TESTFIRST^1505201425400714000000?;4242424242424242=150520142547140130?';
                let res = parseCardTrack(data);
                console.log(11111111,JSON.stringify(res),1111111);
                callback(null, {raw: data, data: res});
            }, 2000);
        } else {
            let RxReplyType = ref.alloc('byte');
            let _CardDataLen = ref.alloc('int');
            let _CardData = Buffer.alloc(1024);

            this.libm.USB_UpTrackData.async(
                this.ComHandle,//HANDLE ComHandle
                0x37,//BYTE tracks
                0x31,//BYTE ReadMode
                0x20,//BYTE _WaitTime
                RxReplyType,//BYTE *RxReplyType
                _CardDataLen,//int *_CardDataLen
                _CardData,//BYTE _CardData[]
                (err, res) => {
                    if (err) {
                        this._emitError('error', '_readTrackPullOut async error: ', err);
                        callback(Errors.internal_error);
                    } else if (res === 0) {
                        RxReplyType = RxReplyType.deref();
                        if (RxReplyType === 0x50) {
                            _CardDataLen = _CardDataLen.deref();
                            let data = '';
                            for (let n = 1; n < _CardDataLen; n++) {
                                data += _CardData[n].toString(16);
                            }
                            let stripeData = (new Buffer(data, 'hex')).toString();
                            stripeData = stripeData.replace(new RegExp('~', 'g'), ';');//convert to parse format
                            callback(null, {raw: stripeData, data: parseCardTrack(stripeData)});
                        } else if (RxReplyType === 0x4E) {
                            this._emitError('error', '_readTrackPullOut Execution Error');
                            callback(Errors.execution_error);
                        } else {
                            this._emitError('error', '_readTrackPullOut RxReplyType Error', RxReplyType);
                            callback(Errors.internal_error);
                        }
                    } else if (res === -2) {
                        this._emitError('error', '_readTrackPullOut Parameter_Error: ', res);
                        callback(Errors.parameter_error);
                    } else if (res === -3) {
                        this._emitError('error', '_readTrackPullOut UpLoadErrorData: ', res);
                        callback(Errors.upload_error_data);
                    } else if (res === -4) {
                        this._emitError('info', '_readTrackPullOut UpLoadTimeOut: ', res);
                        callback(Errors.upload_timeout);
                    } else if (res === -5) {
                        this._emitError('info', '_readTrackPullOut UpLoadCancel: ', res);
                        callback(Errors.upload_cancel);
                    } else {
                        this._emitError('error', '_readTrackPullOut result error: ', res);
                        callback(Errors.internal_error);
                    }
                }
            );
        }
    }

    _cancelReadTrack(callback) {
        if (this.isEmulated) {
            callback(null, true);
        } else {
            this.libm.USB_Cancel_UpTrackData.async(this.ComHandle, (err, res) => {
                    if (err) {
                        this._emitError('error', '_cancelReadTrack async error: ', err);
                        callback(Errors.internal_error);
                    } else if (res === 0) {
                        callback(null, true);
                    } else {
                        this._emitError('error', '_cancelReadTrack result error: ', res);
                        callback(Errors.internal_error);
                    }
                }
            );
        }
    }

    _clearBuffer(callback) {
        if (this.isEmulated) {
            callback(null, true);
        } else {
            this._execCommand(0x39, 0x36, 0, [], (err, res)=> {
                if (err) {
                    this._emitError('error', '_clearBuffer async error: ', err);
                    callback(Errors.internal_error);
                } else if (res.RxReplyType === 0x50) {
                    callback(null, true);
                } else if (res && res.RxReplyType === 0x4E) {
                    this._emitError('error', '_clearBuffer RxReplyType error: ', res.RxStCode1 + ' - ' + res.RxStCode1);
                    callback(Errors.internal_error);
                } else {
                    this._emitError('error', '_clearBuffer result error: ', res);
                    callback(Errors.internal_error);
                }
            });
        }
    }

    _execCommand(TxPmCode, TxCmCode, TxDataLen, TxData, callback) {
        let RxReplyType = ref.alloc('byte');
        let RxStCode1 = ref.alloc('byte');
        let RxStCode0 = ref.alloc('byte');
        let RxDataLen = ref.alloc('int');
        let RxData = Buffer.alloc(1024);

        this.libm.USB_ExeCommand.async(
            this.ComHandle,//HANDLE ComHandle
            TxCmCode,//BYTE TxCmCode
            TxPmCode,//BYTE TxPmCode
            TxDataLen,//int TxDataLen
            TxData,//refArray(ref.types.byte),//BYTE TxData[]
            RxReplyType,//BYTE *RxReplyType
            RxStCode1,//BYTE *RxStCode1
            RxStCode0,//BYTE *RxStCode0
            RxDataLen,//int *RxDataLen
            RxData,//refArray(ref.types.byte)//BYTE RxData[]
            (err, res)=> {
                if (err) {
                    this._emitError('error', '_execCommand async error: ', err);
                    callback(Errors.internal_error);
                } else if (res === 0) {
                    callback(null, {
                        RxReplyType: RxReplyType.deref(),
                        RxStCode1: (new Buffer(RxStCode1.deref().toString(16), 'hex')).toString(),
                        RxStCode0: (new Buffer(RxStCode0.deref().toString(16), 'hex')).toString(),
                        RxDataLen: RxDataLen.deref(),
                        RxData: RxData
                    });
                } else {
                    this._emitError('error', '_execCommand result error: ', res);
                    callback(Errors.internal_error);
                }
            }
        );
    }

    _emitError(type, msg, obj) {
        this.emit('log', {
            type: type,
            msg: msg,
            obj: obj
        });
    }
}

module.exports.CRT_288_K001 = CRT_288_K001;
module.exports.Errors = Errors;
