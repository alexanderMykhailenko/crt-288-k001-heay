#define Bad_CommOpen -101//端口打开错.
#define Bad_CommClose -105//端口关闭错.

#define OK		            0
#define ERR		            -1

#define Parameter_Error		-2   //异步等待读卡参数错误
#define UpLoadErrorData		-3   //异步等待读卡时通讯包错误有错误
#define UpLoadTimeOut		-4   //异步等待读卡时通讯包错误有错误
#define UpLoadCancel    	-5   //异步等待读卡时用户取消


int APIENTRY GetSysVerion(char *strVerion);
HANDLE APIENTRY CRT288KUOpen();
int APIENTRY CRT288KUClose(HANDLE ComHandle);

int APIENTRY CRT288KUMultOpen(HANDLE DeviceHdlData[],int *DeviceNumbers);
int APIENTRY CRT288KUMultClose(HANDLE DeviceHdlData[],int DeviceNumbers);

int APIENTRY GetDeviceCapabilities(HANDLE ComHandle, int *_InputReportByteLength, int *_OutputReportByteLength);
int APIENTRY ReadACKReport(HANDLE ComHandle,  BYTE _ReportData[],BYTE _ReportLen);
int APIENTRY ReadUpReport(HANDLE ComHandle,  BYTE _ReportData[],BYTE _ReportLen);
int APIENTRY ReadReport(HANDLE ComHandle,  BYTE _ReportData[],BYTE _ReportLen);

int APIENTRY WriteReport(HANDLE ComHandle,  BYTE _ReportData[],BYTE _ReportLen);
int APIENTRY USB_ExeCommand(HANDLE ComHandle,BYTE TxCmCode,BYTE TxPmCode,int TxDataLen,BYTE TxData[],BYTE *RxReplyType,BYTE *RxStCode1,BYTE *RxStCode0,int *RxDataLen,BYTE RxData[]);


HANDLE APIENTRY CRT288KROpen(char *Port);
HANDLE APIENTRY CRT288KROpenWithBaut(char *Port, unsigned int Baudrate);
int APIENTRY CRT288KRClose(HANDLE ComHandle);
int APIENTRY RS232_ExeCommand(HANDLE ComHandle,BYTE TxCmCode,BYTE TxPmCode,int TxDataLen,BYTE TxData[],BYTE *RxReplyType,BYTE *RxStCode1,BYTE *RxStCode0,int *RxDataLen,BYTE RxData[]);

//以下为异步等待读磁卡
int APIENTRY USB_UpTrackData(HANDLE ComHandle,BYTE tracks,BYTE ReadMode,BYTE _WaitTime,BYTE *RxReplyType,int *_CardDataLen,BYTE _CardData[]);
int APIENTRY USB_Cancel_UpTrackData(HANDLE ComHandle);

int APIENTRY RS232_UpTrackData(HANDLE ComHandle,BYTE tracks,BYTE ReadMode,BYTE _WaitTime,BYTE *RxReplyType,int *_CardDataLen,BYTE _CardData[]);
int APIENTRY RS232_Cancel_UpTrackData(HANDLE ComHandle);
