#define Bad_CommOpen -101//�˿ڴ򿪴�.
#define Bad_CommClose -105//�˿ڹرմ�.

#define OK		            0
#define ERR		            -1

#define Parameter_Error		-2   //�첽�ȴ�������������
#define UpLoadErrorData		-3   //�첽�ȴ�����ʱͨѶ�������д���
#define UpLoadTimeOut		-4   //�첽�ȴ�����ʱͨѶ�������д���
#define UpLoadCancel    	-5   //�첽�ȴ�����ʱ�û�ȡ��


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

//����Ϊ�첽�ȴ����ſ�
int APIENTRY USB_UpTrackData(HANDLE ComHandle,BYTE tracks,BYTE ReadMode,BYTE _WaitTime,BYTE *RxReplyType,int *_CardDataLen,BYTE _CardData[]);
int APIENTRY USB_Cancel_UpTrackData(HANDLE ComHandle);

int APIENTRY RS232_UpTrackData(HANDLE ComHandle,BYTE tracks,BYTE ReadMode,BYTE _WaitTime,BYTE *RxReplyType,int *_CardDataLen,BYTE _CardData[]);
int APIENTRY RS232_Cancel_UpTrackData(HANDLE ComHandle);
