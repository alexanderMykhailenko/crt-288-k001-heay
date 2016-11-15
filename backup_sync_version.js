var ffi = require('ffi');
var ref = require("ref");
var refArray = require('ref-array');
var EventEmitter = require('events');

var dllConfig = {
    'GetSysVerion': ['int', [ref.refType('string')]],
    'CRT288KUOpen': ['pointer', []],
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
    'USB_UpTrackData':['int',[
        'pointer',//HANDLE ComHandle
        'byte',//BYTE tracks
        'byte',//BYTE ReadMode
        'byte',//BYTE _WaitTime
        refArray(ref.types.byte),//BYTE *RxReplyType
        ref.refType('int'),//int *_CardDataLen
        refArray(ref.types.byte)//BYTE _CardData[]
    ]]
};

class CRT_288_K001 extends EventEmitter{
    constructor(emulateRealDevice = false){
        super();
        this.isEmulated = emulateRealDevice;

        if(this.isEmulated){
            //nothing
        }else{
            this.libm = ffi.Library('CRT_288_K001.dll', dllConfig);
        }
        console.log('CRT_288_K001 run in '+ (this.isEmulated?'emulated':'real device')+' mode');
        //
        //setInterval(()=>{
        //    this.emit('test',{lalka:1});
        //},1000);
    }

    getSysVersion(){
        if(this.isEmulated){
            return '118';
        }else{
            let strVerion = ref.alloc('char');
            let res = this.libm.GetSysVerion(strVerion);
            if(res === 0){
                return strVerion.deref();
            }else{
                console.log('Problem on libm.GetSysVerion');
                return false;
            }
        }
    }

    getSysVersionAsync(){//todo
        let strVerion = ref.alloc('char');
        console.log('start getsysversion async');
        this.libm.GetSysVerion.async(strVerion,function(err,res){
            console.log('done getsys version async',err,res);
            console.log('async strversion',strVerion.deref());
        });
    }

    uptrack(){
        //int APIENTRY USB_UpTrackData(HANDLE ComHandle,BYTE tracks,BYTE ReadMode,BYTE _WaitTime,BYTE *RxReplyType,int *_CardDataLen,BYTE _CardData[]);
        if(this.isEmulated){
            return 'todo';//todo
        }else{
            let ComHandle = this.getComHandle();
            if(!ComHandle){
                console.log('Cannot getComHandle',ComHandle);
                return false;
            }
            let RxReplyType = ref.alloc('byte');
            let _CardDataLen = ref.alloc('int');
            let _CardData = Buffer.alloc(1024);

            console.log(1111);
            setInterval(()=>{
                console.log(121212);
            },10000);
            let res = this.libm.USB_UpTrackData(
                ComHandle,//HANDLE ComHandle
                0x37,//BYTE tracks
                0x31,//BYTE ReadMode
                0x20,//BYTE _WaitTime
                RxReplyType,//BYTE *RxReplyType
                _CardDataLen,//int *_CardDataLen
                _CardData//BYTE _CardData[]
            );
            console.log('res:',res);
            console.log('RxReplyType:',RxReplyType.deref());
            console.log('_CardDataLen:',_CardDataLen.deref());

            //let data = '';
            //for(let n=1; n<res.RxDataLen; n++){
            //    data += _CardData[n].toString(16);
            //}
            //let dataBuffer = new Buffer(data,'hex');
            console.log('_CardData:',(new Buffer(_CardData)).toString());

            return;

            if(res===0){
                return {
                    RxReplyType: RxReplyType.deref(),
                    RxStCode1: (new Buffer(RxStCode1.deref().toString(16),'hex')).toString(),
                    RxStCode0: (new Buffer(RxStCode0.deref().toString(16),'hex')).toString(),
                    RxDataLen: RxDataLen.deref(),
                    RxData: RxData
                };
            }else{
                console.log('Communication Error');
                return false;
            }
        }
    }

    getComHandle(){
        if(!this.ComHandle){
            this.ComHandle = this.libm.CRT288KUOpen();
        }
        return this.ComHandle;
    }

    lockCard(){
        if(this.isEmulated){
            return true;
        }else{
            let res = this.execCommand(0x30,0xB0,0,[]);
            if(res && res.RxReplyType===0x50){
                return true;
            }else if(res && res.RxReplyType===0x4E){
                console.log('Error Code',res.RxStCode1.toString(16),res.RxStCode1.toString(16));
                return false;
            }else{
                console.log('Communication Error',res);
                return false;
            }
        }
    }

    unlockCard(){
        if(this.isEmulated){
            return true;
        }else{
            let res = this.execCommand(0x31,0xB0,0,[]);
            if(res && res.RxReplyType===0x50){
                return true;
            }else if(res && res.RxReplyType===0x4E){
                console.log('Error Code',res.RxStCode1,res.RxStCode1);
                return false;
            }else{
                console.log('Communication Error',res);
                return false;
            }
        }
    }
//void CVCDlg::OnReadTrackPullOutBtn()
//void CVCDlg::OnCancelReadTrackBtn()

    cardStatus(){
        if(this.isEmulated){
            return true;//todo
        }else{
            let res = this.execCommand(0x30,0x31,0,[]);
            if(res && res.RxReplyType===0x50){
                //todo return const value not boolean
                switch (res.RxStCode1){
                    case '0':
                        console.log('Hook lock has been activated');
                        break;
                    case '1':
                        console.log('Hook lock has been released');
                        break;
                    default:
                        break;
                }
                switch (res.RxStCode0){
                    case '0':
                        console.log('No card in the ICRW');
                        break;
                    case '1':
                        console.log('One card in the ICRW, but it is not inserted in place');
                        break;
                    case '2':
                        console.log('One card in the ICRW, but it is inserted in place');
                        break;
                    default:
                        break;
                }
                return true;
            }else if(res && res.RxReplyType===0x4E){
                console.log('Error Code',res.RxStCode1,res.RxStCode1);
                return false;
            }else{
                console.log('Communication Error',res);
                return false;
            }
        }
    }

    readCard(){
        if(this.isEmulated){
            return 'emulated string';//todo read test val
        }else{
            //Magnetic card data return format: ISO#1 + 7EH + ISO#2 + 7EH + ISO#3
            // 7EH its symbol "~"
            let res = this.execCommand(0x31,0x36,2,[0x30,0x37]);//0x31 - track1;  0x32 - track2
            //(new Buffer(RxStCode1.deref().toString(16),'hex')).toString()
            if(res && res.RxData.length > 0 && (res.RxReplyType === 0x50 || res.RxReplyType === 0x4E)){
                if(res.RxData[0] === 0x50){
                    let data = '';
                    for(let n=1; n<res.RxDataLen; n++){
                        data += res.RxData[n].toString(16);
                    }
                    let dataBuffer = new Buffer(data,'hex');
                    return dataBuffer.toString();
                }else if(res.RxData[0] === 0x4E){
                    switch(res.RxData[2])
                    {
                        case 0x36 :
                            console.log("No start bits (STX)");
                            break;
                        case 0x37 :
                            console.log("No stop bits (ETX)");
                            break;
                        case 0x30 :
                            console.log("Byte Parity Error(Parity))");
                            break;
                        case 0x38 :
                            console.log("Parity Bit Error(LRC)");
                            break;
                        case 0x34:
                            console.log("Card Track Data is Blank");
                            break;
                        case 0x33 :
                            console.log("Only(SS-ES-LRC)");
                            break;
                        default :
                            break;
                    }
                    return false;
                }else{
                    console.log('Strange error');
                    return false;
                }
            }else if(res.RxData.length===0 && res.RxReplyType === 0x4E){
                console.log(this.getSANKYOErrMsg(res.RxStCode1, res.RxStCode0), res);
                return false;
            }else{
                console.log('Communication Error',res);
                return false;
            }
        }
    }

    clearBuffer(){
        if(this.isEmulated){
            return true;
        }else {
            let res = this.execCommand(0x39,0x36,0,[]);
            if(res && res.RxReplyType===0x50){
                return true;
            }else if(res && res.RxReplyType===0x4E){
                console.log('Error Code',res.RxStCode1,res.RxStCode1);
                return false;
            }else{
                console.log('Communication Error',res);
                return false;
            }
        }
    }

    getSANKYOErrMsg(chError1, chError2){
        let errorMsg = 'Error: ('+ chError1+')('+chError2+'): ';

        switch(chError1)
        {
            case '0':
                switch(chError2)
                {
                    case '0':
                        errorMsg += "A given command code is unidentified - Command execution error";
                        break;
                    case '1':
                        errorMsg += "Parameter is not correct - Command execution error";
                        break;
                    case '2':
                        errorMsg += "Command execution is impossible - Command execution error";
                        break;
                    case '3':
                        errorMsg += "Hardware is not present - Command execution error";
                        break;
                    case '4':
                        errorMsg += "Command data error - Command execution error";
                        break;
                    case '5':
                        errorMsg += "Tried to card feed commands before the IC contact release command - Command execution error";
                        break;
                    case  '6':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '7':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '8':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case  '9':
                        errorMsg += "-------- - Command execution error";
                        break;
                }
                break;

            case '1':
                switch(chError2)
                {
                    case '0':
                        errorMsg += "Card jam - Command execution error";
                        break;
                    case '1':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case  '2':
                        errorMsg += "Sensor failure  - Command execution error";
                        break;
                    case '3':
                        errorMsg += "Irregular card length (LONG) - Command execution error";
                        break;
                    case '4':
                        errorMsg += "Irregular card length (SHORT) - Command execution error";
                        break;
                    case '5':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case  '6':
                        errorMsg += "The card was moved forcibly - Command execution error";
                        break;
                    case '7':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '8':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case  '9':
                        errorMsg += "-------- - Command execution error";
                        break;
                }
                break;
            case '2':
                errorMsg += "-------- - Command execution error";
                break;
            case '3':
                errorMsg += "-------- - Command execution error";
                break;
            case '4':
                switch(chError2)
                {
                    case '0':
                        errorMsg += "Card was pulled out during capture - Command execution error";
                        break;
                    case '1':
                        errorMsg += "Failure at IC contact solenoid or sensor ICD - Command execution error";
                        break;
                    case  '2':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '3':
                        errorMsg += "Card could not be set to IC contact position - Command execution error";
                        break;
                    case '4':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '5':
                        errorMsg += "ICRW ejected the card forcibly - Command execution error";
                        break;
                    case  '6':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '7':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '8':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '9':
                        errorMsg += "-------- - Command execution error";
                        break;
                }
                break;
            case '5':
                switch(chError2)
                {
                    case '0':
                        errorMsg += "Retract counter overflow - Command execution error";
                        break;
                    case '1':
                        errorMsg += "Motor error - Command execution error";
                        break;
                    case  '2':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '3':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '4':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '5':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case  '6':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '7':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '8':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case  '9':
                        errorMsg += "-------- - Command execution error";
                        break;
                }
                break;
            case '6':
                switch(chError2)
                {
                    case '0':
                        errorMsg += "Abnormal condition was found on the power-line (Vcc) of IC card - Command execution error";
                        break;
                    case '1':
                        errorMsg += "Receiving error of ATR - Command execution error";
                        break;
                    case  '2':
                        errorMsg += "The specified protocol does not agree with that of IC card - Command execution error";
                        break;
                    case '3':
                        errorMsg += "IC card communication error (IC card does not respond). - Command execution error";
                        break;
                    case '4':
                        errorMsg += "IC card communication error (Other than '63') - Command execution error";
                        break;
                    case '5':
                        errorMsg += "HOST sends command for IC card communication before receiving ATR - Command execution error";
                        break;
                    case  '6':
                        errorMsg += "Tried to communicate with IC card not supported in ICRW. - Command execution error";
                        break;
                    case '7':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case '8':
                        errorMsg += "-------- - Command execution error";
                        break;
                    case  '9':
                        errorMsg += "Tried to communicate with IC card not supported in Protocol EMV2000. - Command execution error";
                        break;
                }
                break;
            case 'A':
                switch(chError2)
                {
                    case '0':
                        errorMsg += "NO Card in ICRW - Command execution error";
                        break;
                }
                break;
            case 'B':
                switch(chError2)
                {
                    case '0':
                        errorMsg += "Not received Initialize command - Command execution error";
                        break;
                }
                break;
            default:
                break;

        }
        return errorMsg;
    }

    execCommand(TxPmCode, TxCmCode, TxDataLen, TxData){
        let ComHandle = this.getComHandle();
        if(!ComHandle){
            console.log('Cannot getComHandle',ComHandle);
            return false;
        }
        let RxReplyType = ref.alloc('byte');
        let RxStCode1 = ref.alloc('byte');
        let RxStCode0 = ref.alloc('byte');
        let RxDataLen = ref.alloc('int');
        let RxData = Buffer.alloc(1024);

        let res = this.libm.USB_ExeCommand(
            ComHandle,//HANDLE ComHandle
            TxCmCode,//BYTE TxCmCode
            TxPmCode,//BYTE TxPmCode
            TxDataLen,//int TxDataLen
            TxData,//refArray(ref.types.byte),//BYTE TxData[]
            RxReplyType,//BYTE *RxReplyType
            RxStCode1,//BYTE *RxStCode1
            RxStCode0,//BYTE *RxStCode0
            RxDataLen,//int *RxDataLen
            RxData//refArray(ref.types.byte)//BYTE RxData[]
        );
        if(res===0){
            return {
                RxReplyType: RxReplyType.deref(),
                RxStCode1: (new Buffer(RxStCode1.deref().toString(16),'hex')).toString(),
                RxStCode0: (new Buffer(RxStCode0.deref().toString(16),'hex')).toString(),
                RxDataLen: RxDataLen.deref(),
                RxData: RxData
            };
        }else{
            console.log('Communication Error');
            return false;
        }
    }
}

module.exports = CRT_288_K001;


var CardReader = new CRT_288_K001(false);
var readlineSync = require('readline-sync');
var textFromCli;

textFromCli = readlineSync.question('getSysVersion?');
console.log('getSysVersion',CardReader.getSysVersion());

textFromCli = readlineSync.question('cardStatus?');
console.log('cardStatus', CardReader.cardStatus());

textFromCli = readlineSync.question('lockCard?');
console.log('lockCard', CardReader.lockCard());

textFromCli = readlineSync.question('cardStatus?');
console.log('cardStatus', CardReader.cardStatus());

textFromCli = readlineSync.question('unlockCard?');
console.log('unlockCard', CardReader.unlockCard());

textFromCli = readlineSync.question('cardStatus?');
console.log('cardStatus', CardReader.cardStatus());

textFromCli = readlineSync.question('readCard?');
console.log('readCard',CardReader.readCard());

textFromCli = readlineSync.question('cardStatus?');
console.log('cardStatus', CardReader.cardStatus());

textFromCli = readlineSync.question('readCard?');
console.log('readCard',CardReader.readCard());

textFromCli = readlineSync.question('cardStatus?');
console.log('cardStatus', CardReader.cardStatus());

textFromCli = readlineSync.question('clearBuffer?');
console.log('clearBuffer',CardReader.clearBuffer());

textFromCli = readlineSync.question('cardStatus?');
console.log('cardStatus', CardReader.cardStatus());

textFromCli = readlineSync.question('readCard?');
console.log('readCard',CardReader.readCard());

textFromCli = readlineSync.question('cardStatus?');
console.log('cardStatus', CardReader.cardStatus());

textFromCli = readlineSync.question('done?');

//CardReader.uptrack();
//CardReader.getSysVersionAsync();