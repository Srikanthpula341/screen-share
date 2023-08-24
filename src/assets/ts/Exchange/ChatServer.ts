import { IExchange } from "./IExchange";
import config from "../../../config.json"
import { Settings } from "../Utils/Settings";

declare var io: any; 
const apiUrl='http://127.0.0.1:4000';
const apiUrl2="https://staging.bterai.com";
export class ChatServer implements IExchange{

    room: string;
    yourId: number;
    socket: any;
    connected: boolean = false;

    constructor(room: string, yourId: number){
        var cla = this;
        this.room = room;
        this.yourId = yourId;
        this.connectToServer();
      
    }

    private connectToServer() {
        const stagingApiUrl = 'https://staging.bterai.com';
        const localApiUrl = 'http://127.0.0.1:4000';
    
        this.socket = io(stagingApiUrl, {
            auth: {
                apiKey: "Video_call"
            }
        });
        this.socket.onAny((event, ...args) => console.log(event, args));
       
    
        this.socket.on("connect", () => {
            this.connected = true;
            console.log("Connected to chat server", stagingApiUrl);
            this.socket.emit('login', { room: this.room, id: this.yourId });
        });
    
        this.socket.on("disconnect", () => {
            this.connected = false;
        });
    
        this.socket.on("connect_error", (error) => {
            console.log(`Connection to staging server failed. Error:`, error);
            this.socket.close();
    
            this.socket = io(localApiUrl, {
                auth: {
                    apiKey: "Video_call"
                }
            });
    
            this.socket.on("connect", () => {
                this.connected = true;
                console.log("Connected to local chat server", localApiUrl);
                this.socket.emit('login', { room: this.room, id: this.yourId });
            });
    
            this.socket.on("disconnect", () => {
                this.connected = false;
            });
        });
    }
    
    
    

    sendMessage(data: any, receiver: number = 0): void{
        var cla = this;
        if(cla.connected){
            cla.sendMessageInner(data, receiver);
        } else {
            var authIntervall = setInterval(function(){
                if(cla.connected){
                    cla.sendMessageInner(data, receiver);
                    clearInterval(authIntervall);
                }
            }, 100)
        }
    }

    sendMessageInner(data: any, receiver: number = 0): void{
        //console.log("Exchange message to: " + (receiver !== 0 ? receiver : 'all'));
       // console.log(data);
        this.socket.emit('push', { room: this.room, sender: this.yourId, receiver: receiver, message: data});
    }
 
    addReadEvent(callback: (sender: number, dataroom: string, msg: any) => void): void{
        var cla = this;
        this.socket.on('pull', function(data) {
            if (data.room === cla.room && data.sender !== cla.yourId && (data.receiver == 0 || data.receiver == cla.yourId)) {
                callback(data.sender, data.dataroom, data.message);
            }
          });
    }

    closeConnection(): void{
        this.socket.close();
    }

    //screeen share control
    sendControlEvent(eventData: any): void {
        this.socket.emit('screen-control', {
          room: this.room,
          sender: this.yourId,
          receiver: 0, // Send to all partners
          controlEvent: eventData
        });
      }

      screenShareControlPermission(eventData: any):void{
        
      }

      

}