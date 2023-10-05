export interface IExchange{

    logout(): void;

    sendMessage(data: any, receiver?: number): void;
 
    addReadEvent(callback: (sender: number, dataroom: string, msg: any) => void): void;

    closeConnection(): void;

    sendControlEvent(eventData: any):void;

    screenShareControlPermission(event:any):void;

}