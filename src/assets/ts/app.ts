import "../sass/main.scss";
import '../images/chat.png'; 

import config from "../../config.json"

import { IExchange } from "./Exchange/IExchange";
// import { Firebase } from "./Exchange/Firebase";
import { ICommunication } from "./Communication/ICommunication";
import { WebRTC } from "./Communication/WebRTC";
import { IPartner } from "./Partner/IPartner";
import { IPartners } from "./Partner/IPartners";
import { Partner } from "./Partner/Partner";
import { Controls } from "./Elements/Controls";
import { Screen } from "./Elements/Screen";
import { Devices } from "./Elements/Devices";
import { Textchat } from "./Elements/Textchat";
import { Videogrid } from "./Elements/Videogrid";
import { Video } from "./Elements/Video";
import { PartnerListElement } from "./Elements/PartnerListElement";
import { Userinfo } from "./Elements/Userinfo";
import { Lightbox } from "./Elements/Lightbox";
import { Invite } from "./Elements/Invite";
import { CreateRoom } from "./Elements/CreateRoom";
import { SystemInfo } from "./Elements/SystemInfo";
import { Configuration } from "./Elements/Configuration";
import { JQueryUtils } from "./Utils/JQuery";
import { Alert } from "./Elements/Alert";
import { NoInternet } from "./Elements/NoInternet";
import { Welcome } from "./Elements/Welcome";
import { Translator } from "./Utils/Translator";
import { IceServers } from "./Utils/IceServers";
import { Sounds } from "./Utils/Sounds";
import { Settings } from "./Utils/Settings";
import { ChatServer } from "./Exchange/ChatServer";

export class App{
 

    room: string;
    yourId: number = Math.floor(Math.random()*1000000000);
    yourName: string;
    exchange: IExchange;
    communication: ICommunication;
    yourVideo: HTMLElement;
    listener: boolean = false;
    microphoneOnly: boolean = false;
    microphoneOnlyNotChangeable: boolean = false;
    localStream: any;
    localScreenStream: any;
    partners: IPartners = {};
    controls: Controls;
    screen: Screen;
    devices: Devices;
    textchat: Textchat;
    userinfo: Userinfo;
    videogrid: Videogrid;
    lightbox: Lightbox;
    createRoom: CreateRoom;
    systemInfo: SystemInfo;
    configuration: Configuration;
    noInternet: NoInternet;
    welcome: Welcome;
    invite: Invite;
    closed: boolean = false;
    called: boolean = false;
    readyToCall: boolean = false;
    stateIsSet: boolean = false;
    yourVideoElement: Video;
    partnerListElement: PartnerListElement;
    // screenRecording: boolean = false;
  screenRecorder: MediaRecorder | null = null;
     screenRecording: MediaStream | null = null;

    constructor(){
        this.yourVideo = document.getElementById("yourVideo");
        this.yourVideoElement = new Video(document.getElementById("yourVideoArea"), null);
        this.partnerListElement = new PartnerListElement(null);
        this.controls = new Controls(this);
        this.screen = new Screen(this);
        this.devices = new Devices(this);
        this.textchat = new Textchat(this);
        this.userinfo = new Userinfo(this);
        this.lightbox = new Lightbox(this);
        this.invite = new Invite(this);
        this.createRoom = new CreateRoom(this);
        this.systemInfo = new SystemInfo(this);
        this.configuration = new Configuration(this);
        this.noInternet = new NoInternet(this);
        this.welcome = new Welcome(this);
        this.videogrid = new Videogrid();
        this.videogrid.init();
    }

    run(){ 
        if (location.hash) {
            this.room = decodeURIComponent(location.hash.substring(1));
            this.openConnection();
        } else{
            this.createRoom.showCreateRoom();
        }
        $("#main").show();
        this.videogrid.recalculateLayout();
    }

    openConnection(newRoom: boolean = false){
        if(!this.closed){
            //console.log("Id: " + this.yourId + " Room: " + this.room);
            document.title = this.room + " | " + document.title;
            this.welcome.openDialog(newRoom, this.yourName ? false : true);

            this.addExchange();
            
            this.preloadElements(function(){
                app.readyToCall = true;
                if(app.called){
                    app.callOther();
                }
            });

            app.devices.gotDevices(true);
            setTimeout(function(){
                if(!app.called){
                    app.callOther(); 
                }
            }, 1000);
            app.jsEvents();
        }
    }

    addExchange(){
        if(Settings.getValue(config, "exchangeServices.service") == "chat-server"){
            this.exchange = new ChatServer(this.room, this.yourId);
            app.exchange.addReadEvent(app.readMessage);
        } else {
            // this.exchange = new Firebase(this.room, this.yourId, function(){
            //     app.exchange.addReadEvent(app.readMessage);
            // });
        }
    }

    preloadElements(callback: () => void){
        this.textchat.initialDatabase();
        Sounds.preloadSounds();
        IceServers.loadIceServers(callback);
    }

    initialCamera(first: boolean = false) {
        const constraints = {
            audio: {deviceId: this.devices.devicesVueObject.audio ? {exact: this.devices.devicesVueObject.audio} : undefined}
        };
        if(!this.controls.controlsVueObject.cameraOn){
            this.microphoneOnly = true;
        }
        if(!this.microphoneOnly){
            constraints['video'] = {deviceId: this.devices.devicesVueObject.video ? {exact: this.devices.devicesVueObject.video} : undefined}
        }
        if(this.localStream){
            this.localStream.getTracks().forEach(track => track.stop());
        }
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream){
                app.setAsListener(false);
                if(!app.screen.onScreenMode()){
                    // @ts-ignore
                    app.yourVideo.srcObject = stream;
                }
                app.localStream = stream;
                app.controls.initialiseStream();
                app.setStreamToPartners();
                
                if(first){
                    if(!app.called){
                        app.callOther();  
                    }
                }
            })
            .catch(function(err) {
                if(!app.microphoneOnly){
                    app.microphoneOnly = true;
                    app.microphoneOnlyNotChangeable = true;
                    app.initialCamera(first);
                } else {
                    new Alert(Translator.get("mediaaccesserrormessage"));
                    app.setAsListener(true);
                    app.controls.initialiseStream();
                    if(!app.called){
                        app.callOther(); 
                    }
                    console.log(err);
                }
            });
    }

    callOther(){
        this.called = true;
        if(this.readyToCall){
            this.exchange.sendMessage({'call': 'init'});
        }
    }

    readMessage(sender: number, dataroom: string, msg) {

        if (msg.controlEvent !== undefined) {
            // Interpret and execute control event on remote screen
            // This is where you perform actions based on the received control event
            this.executeControlEvent(msg.controlEvent);
          }
        if(app !== undefined && !app.closed){
           // console.log("Exchange message from: " + sender)
           // console.log(msg)
            if (!(sender in app.partners) && (msg.call !== undefined || msg.sdp !== undefined))
            {
                app.addPartner(sender);
            }
            if((sender in app.partners) && app.partners[sender]){
                var partner = app.partners[sender];
                var partnerConnection = partner.connection;
                partner.lastPing = new Date();
                if (msg.call !== undefined)
                {
                    partner.createOffer(true);
                }
                else if (msg.closing !== undefined)
                {
                    partner.closeConnection();
                    delete app.partners[sender];
                }
                else if (msg.ice !== undefined)
                {
                    partnerConnection.addIceCandidate(new RTCIceCandidate(msg.ice));
                }
                else if (msg.sdp.type === "offer")
                {
                    app.partners[sender].createAnswer(msg.sdp);
                }
                else if (msg.sdp.type === "answer")
                {
                    partnerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                }
            }
        }
    }
    //screen control
    executeControlEvent(controlEvent) {
        if (controlEvent.type === 'mousemove') {
          this.moveMouse(controlEvent.clientX, controlEvent.clientY);
        } else if (controlEvent.type === 'mousedown') {
          this.simulateMouseDown(controlEvent.clientX, controlEvent.clientY, controlEvent.button);
        } else if (controlEvent.type === 'mouseup') {
          this.simulateMouseUp(controlEvent.clientX, controlEvent.clientY, controlEvent.button);
        }
        // ... Add more cases for other control event types ...
      }

      moveMouse(x, y) {
        // Move the virtual cursor on the remote screen (example)
        const cursor = document.getElementById('remoteCursor');
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
      }

      simulateMouseDown(x, y, button) {
        // Simulate mouse down action on the remote screen (example)
        // Create a new element or interact with existing elements
        const newElement = document.createElement('div');
        newElement.className = 'simulated-mouse-down';
        newElement.style.left = x + 'px';
        newElement.style.top = y + 'px';
        newElement.textContent = 'Mouse Down';
        document.body.appendChild(newElement);
      }

      simulateMouseUp(x, y, button) {
        // Simulate mouse up action on the remote screen (example)
        // Remove or update elements created during mouse down
        const simulatedMouseDown = document.querySelector('.simulated-mouse-down');
        if (simulatedMouseDown) {
          simulatedMouseDown.textContent = 'Mouse Up';
        }
      }

    addPartner(partnerId: number){
        var cla = this;
        if(partnerId in app.partners){
            this.partners[partnerId].closeConnection();
            delete this.partners[partnerId];
        }
        this.partners[partnerId] = null;
        this.partners[partnerId] = new Partner(partnerId, this.exchange, this.devices, this.textchat, this.videogrid, this.controls, this.partnerOnConnected, this.partnerOnConnectionClosed, this.partnerOnConnectionLosed); 
        this.setStreamToPartner(this.partners[partnerId], true);
        this.videogrid.recalculateLayout();
        Sounds.playSound(Sounds.newpartnersound, this);
    }

    partnerOnConnected(partner: IPartner){
        app.setStreamToPartner(partner);
    }

    partnerOnConnectionLosed(partner: IPartner){
    }

    partnerOnConnectionClosed(partner: IPartner){
        if(partner.id in app.partners){
            delete this.partners[partner.id];
        }
    }

    setStreamToPartners(){
        for (var id in this.partners) {
            this.setStreamToPartner(this.partners[id]);
        }
    }

    setStreamToPartner(partner: IPartner, initial: boolean = false){
        var reconnectionNeeded: boolean = false;
        if(app.localStream){
            if(!app.microphoneOnly){
                var videoTrack = !app.screen.onScreenMode() ? app.localStream.getVideoTracks()[0] : app.localScreenStream.getVideoTracks()[0];
                reconnectionNeeded = app.setTrackToPartner(partner, app.localStream, videoTrack, reconnectionNeeded);
            }else if(app.screen.onScreenMode()){
                var videoTrack = app.localScreenStream.getVideoTracks()[0];
                reconnectionNeeded = app.setTrackToPartner(partner, app.localStream, videoTrack, reconnectionNeeded);
            }
            var audioTrack = app.localStream.getAudioTracks()[0];
            reconnectionNeeded = app.setTrackToPartner(partner, app.localStream, audioTrack, reconnectionNeeded);
        } else if(app.localScreenStream){
            var videoTrack = app.localScreenStream.getVideoTracks()[0];
            reconnectionNeeded = app.setTrackToPartner(partner, app.localScreenStream, videoTrack, reconnectionNeeded);
        }
        if(!initial && reconnectionNeeded){
            partner.reloadConnection();
        }
        partner.sendMessage(app.userinfo.getUserInfo());
    }

    setTrackToPartner(partner: IPartner, stream: any, track: any, reconnectionNeeded: boolean): boolean{
        var sender = partner.connection.getSenders().find(function(s) {
            return s.track && track && s.track.kind == track.kind;
        });
        if(sender){
            if(partner.connected){
                sender.replaceTrack(track);
            }
        } else {
            partner.connection.addTrack(track, stream);
            return true;
        }
        return reconnectionNeeded;
    }

    sendMessageToAllPartners(message: any){
        for (var id in this.partners) {
            if(this.partners[id]){
                this.partners[id].sendMessage(message);
            }
        }
    }

    sidebarToogle(open: boolean){
        $(".maincontainer").toggleClass("opensidebar"); 
        this.textchat.scrollToBottom();
        this.videogrid.recalculateLayout();
        //fix bug when calculation was wrong in the first calculation
        this.videogrid.recalculateLayout();
        //add history state on mobile to close sidebar on back button
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
            if(open){
                if(this.stateIsSet){
                    window.history.replaceState('forward', null, null);
                }else{
                    window.history.pushState('forward', null, null);
                    this.stateIsSet = true;
                }
            }else{
                window.history.replaceState('back', null, null);
            }
        }
    }

    setAsListener(listener: boolean){
        this.listener = listener;
        this.yourVideoElement.videoVueObject.listener = listener;
        this.partnerListElement.partnerListElementVueObject.listener = listener;
    }

    hangOut(){
        if(!this.closed){
            this.closed = true;
            this.exchange.sendMessage({'closing': this.yourId});
            this.exchange.closeConnection();
            for (var id in this.partners) {
                if(this.partners[id]){
                    this.partners[id].closeConnection();
                }
            }
            Sounds.playSound(Sounds.hangoutsound, this);
            this.videogrid.recalculateLayout();
        }
    }

    jsEvents(){
        window.onhashchange = function() {
            if(app.room !== decodeURIComponent(location.hash.substring(1))){
                location.reload();
            }
        }
        setInterval(function(){
            app.noInternet.setNoInternet(!window.navigator.onLine);
        }, 500);
        addEventListener("popstate",function(e){
            if(app.stateIsSet){
                if(app.controls.controlsVueObject.optionOn){
                    app.controls.controlsVueObject.toogleOption();
                } else {
                    window.history.back();
                }
            }
            app.stateIsSet = false;
        });
        $(window).on("beforeunload", function() { 
            app.hangOut();
        });
        $(window).on("unload", function() {
            app.hangOut();
        });
        $(window).on("pagehide", function() {
            app.hangOut();
        });
        window.onbeforeunload = app.hangOut;
        $(app.yourVideo).on("loadeddata", function() {
            app.videogrid.recalculateLayout();
        });
    }

    //screen record

    startScreenRecording() {
        console.log('"object" :>> ', "object");
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true })
                .then((stream: MediaStream) => {
                    this.screenRecording = stream;
                    this.screenRecorder = new MediaRecorder(stream);
                    const chunks: BlobPart[] = [];

                    this.screenRecorder.ondataavailable = (event: BlobEvent) => {
                        if (event.data.size > 0) {
                            chunks.push(event.data);
                        }
                    };

                    this.screenRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        const url = URL.createObjectURL(blob);

                        const videoElement = document.createElement('video');
                        videoElement.src = url;
                        videoElement.controls = true;
                        document.body.appendChild(videoElement);
                    };

                    this.screenRecorder.start();
                })
                .catch((error: any) => {
                    console.error('Error starting screen recording:', error);
                });
        } else {
            console.error('Screen recording is not supported in this browser.');
        }
    }

    stopScreenRecording() {
        if (this.screenRecorder) {
            this.screenRecorder.stop();
            if (this.screenRecording) {
                this.screenRecording.getTracks().forEach(track => track.stop());
            }
        }
    } 
    

    handleMouseMove(event) {
        const eventData = {
            type: 'mousemove',
            clientX: event.clientX,
            clientY: event.clientY
        };
       // console.log('eventData :>> ', eventData);
        this.exchange.sendControlEvent(eventData);
    }
    handleMouseEvent(eventType, clientX, clientY, button) {
        const eventData = {
            type: eventType,
            clientX: clientX,
            clientY: clientY,
            button: button
        };
        //console.log('eventData:', eventData);
        //this.exchange.sendControlEvent(eventData);
    }

    handleKeyboardEvent(eventType, key, keyCode) {
        const eventData = {
            type: eventType,
            key: key,
            keyCode: keyCode
        };
        console.log('eventData:', eventData);
        this.exchange.sendControlEvent(eventData);
        //this.exchange
    }


   
      
}


var app = null;
$(function() {
  
    Translator.setTranslationsInHTML();
    app = new App();
    app.run();

    $(document).on('mousemove', function(event) {
        if (app && app.exchange) {
            app.handleMouseEvent('mousemove', event.clientX, event.clientY);
        }
    });

    $(document).on('mousedown', function(event) {
        if (app && app.exchange) {
            app.handleMouseEvent('mousedown', event.clientX, event.clientY, event.button);
        }
    });

    $(document).on('mouseup', function(event) {
        if (app && app.exchange) {
            app.handleMouseEvent('mouseup', event.clientX, event.clientY, event.button);
        }
    });

    $(document).on('keydown', function(event) {
        if (app && app.exchange) {
            app.handleKeyboardEvent('keydown', event.key, event.keyCode);
        }
    });

    // $(document).on('keyup', function(event) {
    //     if (app && app.exchange) {
    //         app.handleKeyboardEvent('keyup', event.key, event.keyCode);
    //     }
    // });

    // $(document).on('keypress', function(event) {
    //     if (app && app.exchange) {
    //         app.handleKeyboardEvent('keypress', event.key, event.keyCode);
    //     }
    // });
});