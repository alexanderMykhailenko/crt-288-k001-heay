var ffi = require('ffi');
var ref = require("ref");
var refArray = require('ref-array');
var EventEmitter = require('events');
var parseCardTrack = require('./parseCardTrack');
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
    execution_error: "Execution error",
    read_card_codes: {
        0x36: "No start bits (STX)",
        0x37: "No stop bits (ETX)",
        0x30: "Byte Parity Error(Parity))",
        0x38: "Parity Bit Error(LRC)",
        0x34: "Card Track Data is Blank",
        0x33: "Only(SS-ES-LRC)"
    }
};

/*
 3. Communication Speed: Adopt USB 2.0 full-speed and USB HID protocol, therefore interruption interval
 is 1ms, Description report is 65 bytes, Maximum byte per second is 65000 bytes.
 */
//todo Notes: For USB communication mode, the start-up phase (Initialization phase) is 6 seconds, therefore please
//manipulate the reader after 6 seconds

class CRT_288_K001 extends EventEmitter {
    constructor(emulateRealDevice = false) {
        super();
        this.isEmulated = emulateRealDevice;

        if (this.isEmulated) {
            //nothing
        } else {
            this.libm = ffi.Library('CRT_288_K001.dll', dllConfig);
        }
    }

    safeCardRead(callback) {
        var self = this;
        if (this.isEmulated) {
            this.readTrackPullOut(callback);
        } else {
            let resultData;
            async.series([
                function (cb) {
                    setTimeout(function () {
                        self.getSysVersion(function (err, res) {
                            if (err) {
                                cb(err);
                            } else if (!res) {
                                cb(Errors.internal_error);
                            } else {
                                cb();
                            }
                        });
                    }, 10);
                },
                function (cb) {
                    setTimeout(function () {
                        self.clearBuffer(function (err, res) {
                            if (err) {
                                cb(err);
                            } else if (!res) {
                                cb(Errors.internal_error);
                            } else {
                                cb();
                            }
                        });
                    }, 10);
                },
                function (cb) {
                    setTimeout(function () {
                        self.readCard(function (err, res) {
                            if (err && err === Errors.read_card_codes[0x34]) {//0x34: "Card Track Data is Blank",
                                cb();//it's ok
                            } else if (err) {
                                cb(err);
                            } else if (res) {//if not empty res it's problem with buffer
                                cb(Errors.internal_error);
                            } else {
                                cb(Errors.internal_error);
                            }
                        });
                    }, 10);
                },
                function (cb) {
                    setTimeout(function () {
                        self.readTrackPullOut(function (err, res) {
                            if (err) {
                                cb(err);
                            } else if (!res) {
                                cb(Errors.internal_error);
                            } else {
                                resultData = res;
                                cb();
                            }
                        });
                    }, 10);
                },
                function (cb) {
                    setTimeout(function () {
                        self.clearBuffer(function (err, res) {
                            if (err) {
                                cb(err);
                            } else if (!res) {
                                cb(Errors.internal_error);
                            } else {
                                cb();
                            }
                        });
                    }, 10);
                }
            ], function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, resultData);
                }
            });
        }
    }

    safeCancelCardRead(callback) {
        var self = this;
        if (this.isEmulated) {
            this.cancelReadTrack(callback);
        } else {
            let resultData;
            async.series([
                function (cb) {
                    setTimeout(function () {
                        self.getSysVersion(function (err, res) {
                            if (err) {
                                cb(err);
                            } else if (!res) {
                                cb(Errors.internal_error);
                            } else {
                                cb();
                            }
                        });
                    }, 10);
                },
                function (cb) {
                    setTimeout(function () {
                        self.cancelReadTrack(function (err, res) {
                            if (err) {
                                cb(err);
                            } else if (!res) {
                                cb(Errors.internal_error);
                            } else {
                                resultData = res;
                                cb();
                            }
                        });
                    }, 1500);
                },
                function (cb) {
                    setTimeout(function () {
                        self.clearBuffer(function (err, res) {
                            if (err) {
                                cb(err);
                            } else if (!res) {
                                cb(Errors.internal_error);
                            } else {
                                cb();
                            }
                        });
                    }, 10);
                },
                function (cb) {
                    setTimeout(function () {
                        self.readCard(function (err, res) {
                            if (err && err === Errors.read_card_codes[0x34]) {//0x34: "Card Track Data is Blank",
                                cb();//it's ok
                            } else if (err) {
                                cb(err);
                            } else if (res) {//if not empty res it's problem with buffer
                                cb(Errors.internal_error);
                            } else {
                                cb(Errors.internal_error);
                            }
                        });
                    }, 10);
                }
            ], function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, resultData);
                }
            });
        }
    }

    getSysVersion(callback) {
        var self = this;//todo check string functions
        if (this.isEmulated) {
            callback(null, '118');
        } else {
            let strVerion = ref.alloc('char');
            this.libm.GetSysVerion.async(strVerion, function (err, res) {
                if (err) {
                    self._emitError('Error getSysVersionAsync async error: ', err);
                    callback(Errors.internal_error);
                } else if (res === 0) {
                    callback(null, strVerion.deref());
                } else {
                    self._emitError('Error getSysVersionAsync result error: ', res);
                    callback(Errors.internal_error);
                }
            });
        }
    }

    readTrackPullOut(callback) {
        var self = this;
        if (this.isEmulated) {
            setTimeout(()=> {
                let data = '%B4242424242424242^TESTLAST/TESTFIRST^1505201425400714000000?;4242424242424242=150520142547140130?';
                callback(null, {raw: data, data: parseCardTrack(data)});
            }, 2000);
        } else {
            let ComHandle = this._getComHandle();
            if (!ComHandle) {
                self._emitError('Error readTrackPullOut Cannot _getComHandle', ComHandle);
                callback(Errors.internal_error);
                return;
            }

            let RxReplyType = ref.alloc('byte');
            let _CardDataLen = ref.alloc('int');
            let _CardData = Buffer.alloc(1024);

            this.libm.USB_UpTrackData.async(
                ComHandle,//HANDLE ComHandle
                0x37,//BYTE tracks
                0x31,//BYTE ReadMode
                0x20,//BYTE _WaitTime
                RxReplyType,//BYTE *RxReplyType
                _CardDataLen,//int *_CardDataLen
                _CardData,//BYTE _CardData[]
                function (err, res) {
                    if (err) {
                        self._emitError('Error readTrackPullOut async error: ', err);
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
                            stripeData = '%' + stripeData.replace(new RegExp('~', 'g'), ';');//convert to parse format
                            callback(null, {raw: stripeData, data: parseCardTrack(stripeData)});
                        } else if (RxReplyType === 0x4E) {
                            self._emitError('Error readTrackPullOut Execution Error');
                            callback(Errors.execution_error);
                        } else {
                            self._emitError('Error readTrackPullOut RxReplyType Error', RxReplyType);
                            callback(Errors.internal_error);
                        }
                    } else if (res === -2) {
                        self._emitError('Error readTrackPullOut Parameter_Error: ', res);
                        callback(Errors.parameter_error);
                    } else if (res === -3) {
                        self._emitError('Error readTrackPullOut UpLoadErrorData: ', res);
                        callback(Errors.upload_error_data);
                    } else if (res === -4) {
                        self._emitError('Error readTrackPullOut UpLoadTimeOut: ', res);
                        callback(Errors.upload_timeout);
                    } else if (res === -5) {
                        self._emitError('Error readTrackPullOut UpLoadCancel: ', res);
                        callback(Errors.upload_cancel);
                    } else {
                        self._emitError('Error readTrackPullOut result error: ', res);
                        callback(Errors.internal_error);
                    }
                }
            );
        }
    }

    cancelReadTrack(callback) {
        var self = this;
        if (this.isEmulated) {
            callback(null, true);
        } else {
            let ComHandle = this._getComHandle();
            if (!ComHandle) {
                self._emitError('Error cancelReadTrack Cannot _getComHandle', ComHandle);
                callback(Errors.internal_error);
                return;
            }

            this.libm.USB_Cancel_UpTrackData.async(ComHandle, function (err, res) {
                    if (err) {
                        self._emitError('Error cancelReadTrack async error: ', err);
                        callback(Errors.internal_error);
                    } else if (res === 0) {
                        callback(null, true);
                    } else {
                        self._emitError('Error cancelReadTrack result error: ', res);
                        callback(Errors.internal_error);
                    }
                }
            );
        }
    }

    lockCard(callback) {
        var self = this;
        if (this.isEmulated) {
            callback(null, true);
        } else {
            this.execCommand(0x30, 0xB0, 0, [], function (err, res) {
                if (err) {
                    self._emitError('Error lockCard async error: ', err);
                    callback(Errors.internal_error);
                } else if (res.RxReplyType === 0x50) {
                    callback(null, true);
                } else if (res.RxReplyType === 0x4E) {
                    self._emitError('Error lockCard RxReplyType error: ', res.RxStCode1.toString(16) + ' - ' + res.RxStCode1.toString(16));
                    callback(Errors.internal_error);
                } else {
                    self._emitError('Error lockCard result error: ', res);
                    callback(Errors.internal_error);
                }
            });
        }
    }

    unlockCard(callback) {
        var self = this;
        if (this.isEmulated) {
            callback(null, true);
        } else {
            this.execCommand(0x31, 0xB0, 0, [], function (err, res) {
                if (err) {
                    self._emitError('Error unlockCard async error: ', err);
                    callback(Errors.internal_error);
                } else if (res.RxReplyType === 0x50) {
                    callback(null, true);
                } else if (res.RxReplyType === 0x4E) {
                    self._emitError('Error unlockCard RxReplyType error: ', res.RxStCode1.toString(16) + ' - ' + res.RxStCode1.toString(16));
                    callback(Errors.internal_error);
                } else {
                    self._emitError('Error unlockCard result error: ', res);
                    callback(Errors.internal_error);
                }
            });
        }
    }

    cardStatus(callback) {
        var self = this;
        let CardStatusCodes = {
            lock_status: {
                '0': 'Hook lock has been activated',
                '1': 'Hook lock has been released'
            },
            card_status: {
                '0': 'No card in the ICRW',
                '1': 'One card in the ICRW, but it is not inserted in place',
                '2': 'One card in the ICRW, but it is inserted in place'
            }
        };

        if (this.isEmulated) {
            callback(null, {
                lock_status: CardStatusCodes.lock_status['1'],
                card_status: CardStatusCodes.card_status['0']
            });
        } else {
            this.execCommand(0x30, 0x31, 0, [], function (err, res) {
                if (err) {
                    self._emitError('Error cardStatus async error: ', err);
                    callback(Errors.internal_error);
                } else if (res.RxReplyType === 0x50) {
                    if (typeof CardStatusCodes.lock_status[res.RxStCode1] !== 'undefined' && typeof CardStatusCodes.card_status[res.RxStCode0] !== 'undefined') {
                        callback(null, {
                            lock_status: CardStatusCodes.lock_status[res.RxStCode1],
                            card_status: CardStatusCodes.card_status[res.RxStCode0]
                        });
                    } else {
                        self._emitError('Error cardStatus code not found error: ', res.RxStCode1.toString(16) + ' - ' + res.RxStCode1.toString(16));
                        callback(Errors.internal_error);
                    }
                } else if (res.RxReplyType === 0x4E) {
                    self._emitError('Error cardStatus RxReplyType error: ', res.RxStCode1.toString(16) + ' - ' + res.RxStCode1.toString(16));
                    callback(Errors.internal_error);
                } else {
                    self._emitError('Error cardStatus result error: ', res);
                    callback(Errors.internal_error);
                }
            });
        }
    }

    readCard(callback) {//Magnetic card data return format: ISO#1 + 7EH + ISO#2 + 7EH + ISO#3 // 7EH its symbol "~"
        var self = this;
        if (this.isEmulated) {
            let data = '%B4242424242424242^TESTLAST/TESTFIRST^1505201425400714000000?;4242424242424242=150520142547140130?';
            callback(null, {raw: data, data: parseCardTrack(data)});
        } else {
            this.execCommand(0x31, 0x36, 2, [0x30, 0x37], function (err, res) {//0x31 - track1;  0x32 - track2
                if (err) {
                    self._emitError('Error readCard async error: ', err);
                    callback(Errors.internal_error);
                } else if (res.RxData.length > 0 && (res.RxReplyType === 0x50 || res.RxReplyType === 0x4E)) {
                    if (res.RxData[0] === 0x50) {
                        let data = '';
                        for (let n = 1; n < res.RxDataLen; n++) {
                            data += res.RxData[n].toString(16);
                        }
                        let stripeData = (new Buffer(data, 'hex')).toString();
                        stripeData = '%' + stripeData.replace(new RegExp('~', 'g'), ';');//convert to parse format
                        callback(null, stripeData);
                    } else if (res.RxData[0] === 0x4E) {
                        if (typeof Errors.read_card_codes[res.RxData[2]] !== 'undefined') {
                            callback(Errors.read_card_codes[res.RxData[2]]);
                        } else {
                            self._emitError('Error readCard result error: ', res.RxData[2].toString(16));
                            callback(Errors.internal_error);
                        }
                    } else {
                        self._emitError('Error readCard RxData error: ', res.RxData[0].toString(16));
                        callback(Errors.internal_error);
                    }
                } else if (res.RxData.length === 0 && res.RxReplyType === 0x4E) {
                    self._emitError('Error readCard SANKYOErrMsg error: ', this._getSANKYOErrMsg(res.RxStCode1, res.RxStCode0));
                    callback(Errors.internal_error);
                } else {
                    self._emitError('Error readCard result error: ', res);
                    callback(Errors.internal_error);
                }
            });
        }
    }

    clearBuffer(callback) {
        var self = this;
        if (this.isEmulated) {
            callback(null, true);
        } else {
            this.execCommand(0x39, 0x36, 0, [], function (err, res) {
                if (err) {
                    self._emitError('Error clearBuffer async error: ', err);
                    callback(Errors.internal_error);
                } else if (res.RxReplyType === 0x50) {
                    callback(null, true);
                } else if (res && res.RxReplyType === 0x4E) {
                    self._emitError('Error clearBuffer RxReplyType error: ', res.RxStCode1.toString(16) + ' - ' + res.RxStCode1.toString(16));
                    callback(Errors.internal_error);
                } else {
                    self._emitError('Error clearBuffer result error: ', res);
                    callback(Errors.internal_error);
                }
            });
        }
    }

    execCommand(TxPmCode, TxCmCode, TxDataLen, TxData, callback) {
        var self = this;
        let ComHandle = this._getComHandle();
        if (!ComHandle) {
            self._emitError('Error execCommand Cannot _getComHandle', ComHandle);
            callback(Errors.internal_error);
            return;
        }
        let RxReplyType = ref.alloc('byte');
        let RxStCode1 = ref.alloc('byte');
        let RxStCode0 = ref.alloc('byte');
        let RxDataLen = ref.alloc('int');
        let RxData = Buffer.alloc(1024);

        this.libm.USB_ExeCommand.async(
            ComHandle,//HANDLE ComHandle
            TxCmCode,//BYTE TxCmCode
            TxPmCode,//BYTE TxPmCode
            TxDataLen,//int TxDataLen
            TxData,//refArray(ref.types.byte),//BYTE TxData[]
            RxReplyType,//BYTE *RxReplyType
            RxStCode1,//BYTE *RxStCode1
            RxStCode0,//BYTE *RxStCode0
            RxDataLen,//int *RxDataLen
            RxData,//refArray(ref.types.byte)//BYTE RxData[]
            function (err, res) {
                if (err) {
                    self._emitError('Error execCommand async error: ', err);
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
                    self._emitError('Error execCommand result error: ', res);
                    callback(Errors.internal_error);
                }
            }
        );
    }

    _getComHandle() {
        if (!this.ComHandle) {
            this.ComHandle = this.libm.CRT288KUOpen();
        }
        return this.ComHandle;
    }

    closeComHandle(){
        console.log('closeComHandle',this.libm.CRT288KUClose(this._getComHandle()));
    }

    _emitError(msg, obj) {
        this.emit('log', {
            msg: msg,
            obj: obj
        });
    }

    _getSANKYOErrMsg(chError1, chError2) {
        let ReadCardErrorCodes = {
            '0': {
                '0': "A given command code is unidentified - Command execution error",
                '1': "Parameter is not correct - Command execution error",
                '2': "Command execution is impossible - Command execution error",
                '3': "Hardware is not present - Command execution error",
                '4': "Command data error - Command execution error",
                '5': "Tried to card feed commands before the IC contact release command - Command execution error",
                '6': "-------- - Command execution error",
                '7': "-------- - Command execution error",
                '8': "-------- - Command execution error",
                '9': "-------- - Command execution error"
            },
            '1': {
                '0': "Card jam - Command execution error",
                '1': "-------- - Command execution error",
                '2': "Sensor failure  - Command execution error",
                '3': "Irregular card length (LONG) - Command execution error",
                '4': "Irregular card length (SHORT) - Command execution error",
                '5': "-------- - Command execution error",
                '6': "The card was moved forcibly - Command execution error",
                '7': "-------- - Command execution error",
                '8': "-------- - Command execution error",
                '9': "-------- - Command execution error"
            },
            '2': "-------- - Command execution error",
            '3': "-------- - Command execution error",
            '4': {
                '0': "Card was pulled out during capture - Command execution error",
                '1': "Failure at IC contact solenoid or sensor ICD - Command execution error",
                '2': "-------- - Command execution error",
                '3': "Card could not be set to IC contact position - Command execution error",
                '4': "-------- - Command execution error",
                '5': "ICRW ejected the card forcibly - Command execution error",
                '6': "-------- - Command execution error",
                '7': "-------- - Command execution error",
                '8': "-------- - Command execution error",
                '9': "-------- - Command execution error"
            },
            '5': {
                '0': "Retract counter overflow - Command execution error",
                '1': "Motor error - Command execution error",
                '2': "-------- - Command execution error",
                '3': "-------- - Command execution error",
                '4': "-------- - Command execution error",
                '5': "-------- - Command execution error",
                '6': "-------- - Command execution error",
                '7': "-------- - Command execution error",
                '8': "-------- - Command execution error",
                '9': "-------- - Command execution error"
            },
            '6': {
                '0': "Abnormal condition was found on the power-line (Vcc) of IC card - Command execution error",
                '1': "Receiving error of ATR - Command execution error",
                '2': "The specified protocol does not agree with that of IC card - Command execution error",
                '3': "IC card communication error (IC card does not respond). - Command execution error",
                '4': "IC card communication error (Other than '63') - Command execution error",
                '5': "HOST sends command for IC card communication before receiving ATR - Command execution error",
                '6': "Tried to communicate with IC card not supported in ICRW. - Command execution error",
                '7': "-------- - Command execution error",
                '8': "-------- - Command execution error",
                '9': "Tried to communicate with IC card not supported in Protocol EMV2000. - Command execution error"
            },
            'A': {
                '0': "NO Card in ICRW - Command execution error"
            },
            'B': {
                '0': "Not received Initialize command - Command execution error"
            }
        };

        let errorMsg = 'Error: (' + chError1 + ')(' + chError2 + '): ';

        if (typeof ReadCardErrorCodes[chError1] !== 'undefined') {
            if (typeof ReadCardErrorCodes[chError1] === 'string') {
                return errorMsg + ReadCardErrorCodes[chError1];
            } else if (typeof ReadCardErrorCodes[chError1][chError2] !== 'undefined') {
                return errorMsg + ReadCardErrorCodes[chError1][chError2];
            } else {
                return errorMsg + 'message with chError2 code not found';
            }
        }
        return errorMsg + 'message with chError1 code not found';
    }
}

module.exports = CRT_288_K001;
