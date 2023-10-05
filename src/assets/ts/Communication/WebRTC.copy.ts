import { ICommunication } from "./ICommunication";
import { IPartner } from "../Partner/IPartner";
import { IceServers } from "../Utils/IceServers";
import { Cookie } from "../Utils/Cookie";

export class WebRTC implements ICommunication {
 


    audioRecorder: MediaRecorder | null = null;
    videoRecorder: MediaRecorder | null = null;
    audioBlobs: Blob[] = [];
    videoBlobs: Blob[] = [];

  servers = { iceServers: IceServers.iceServers };
  partner: IPartner;
  onicecandidateEvent: (candidate: any, partner: IPartner) => void;
  onaddtrackEvent: (stream: any, partner: IPartner) => void;
  connectionLosedEvent: (partner: IPartner) => void;
  connectionEvent: (partner: IPartner) => void;
  checkingEvent: (partner: IPartner) => void;
  onMessageEvent: (message: any, partner: IPartner) => void;

  constructor(partner: IPartner) {
    this.partner = partner;
    this.bindRecordingButton()
  }

  


  getPeerConnection(): RTCPeerConnection {
    var pc = new RTCPeerConnection(this.servers);
    this.setPCEvents(pc);
    return pc;
  }

  setPCEvents(pc: RTCPeerConnection) {
    let cla = this;
    pc.onicecandidate = function (event) {
      if (event.candidate) {
        cla.onicecandidateEvent(event.candidate, cla.partner);
      } else {
        console.log("Sent All Ice to " + cla.partner.id);
      }
    };
    // @ts-ignore
    pc.ontrack = function (event) {
        cla.startRecording(event.streams[0]);
      return cla.onaddtrackEvent(event.streams[0], cla.partner);
    };
    pc.oniceconnectionstatechange = function () {
      console.log("ICE status: " + pc.iceConnectionState);
      if (pc.iceConnectionState == "disconnected") {
        cla.stopRecording();
        cla.connectionLosedEvent(cla.partner);
      } else if (pc.iceConnectionState == "connected") {
        cla.connectionEvent(cla.partner);
      } else if (pc.iceConnectionState == "checking") {
        cla.checkingEvent(cla.partner);
      }
    };
  }

  getDataChannel(pc: RTCPeerConnection) {
    let cla = this;
    var dataChannel = pc.createDataChannel("chat", { negotiated: true, id: 0 });

    dataChannel.onerror = function (error) {
      console.log(error);
    };

    dataChannel.onmessage = function (event) {
      cla.onMessageEvent(JSON.parse(event.data), cla.partner);
    };

    dataChannel.onclose = function (event) {
      console.log("Data Channel is diconnected!");
      //cla.connectionLosedEvent(cla.partner);
    };

    return dataChannel;
  }

  addOnicecandidateEvent(
    callback: (candidate: any, partner: IPartner) => void
  ): void {
    this.onicecandidateEvent = callback;
  }

  addOnaddtrackEvent(callback: (stream: any, partner: IPartner) => void): void {
    this.onaddtrackEvent = callback;
  }

  addConnectionLosedEvent(callback: (partner: IPartner) => void): void {
    this.connectionLosedEvent = callback;
  }

  addConnectionEvent(callback: (partner: IPartner) => void): void {
    this.connectionEvent = callback;
  }

  addCheckingEvent(callback: (partner: IPartner) => void): void {
    this.checkingEvent = callback;
  }

  addOnMessageEvent(callback: (message: any, partner: IPartner) => void): void {
    this.onMessageEvent = callback;
  }


  bindRecordingButton() {
    const recordButton = document.getElementById('recordMedia');
    if (!recordButton) return;

    let isRecording = false;

    recordButton.addEventListener('click', () => {
        if (!isRecording) {
            console.log('this.partner :>> ', this.partner);
            if (this.partner && this.partner.stream) {
                this.startRecording(this.partner.stream);
            }
            
            else {
                console.error("No stream found to record");
                return;
            }
            recordButton.textContent = 'Stop Recording';
            isRecording = true;
        } else {
            this.stopRecording();
            recordButton.textContent = 'Start Recording';
            isRecording = false;
        }
    });
}

startRecording(stream: MediaStream) {
    this.audioRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    this.audioRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
            this.audioBlobs.push(event.data);
        }
    };
    this.audioRecorder.start(10);
}

stopRecording() {
    const timestamp = new Date().toISOString().replace(/[:\-]+/g, '');
    if (this.audioRecorder) {
        this.audioRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioBlobs, { type: 'audio/webm' });
            var name =Cookie.getCookie("name") || "hello"
            this.saveRecording(audioBlob, `${name}audio_${timestamp}.webm`);
        };
        this.audioRecorder.stop();
    }
}

saveRecording(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}
}
