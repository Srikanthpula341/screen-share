
const signalingServerURL = "http://192.168.39.38:3000";

var room_id;
var local_stream;
var screenStream;
var peer = null;
var currentPeer = null;
var screenSharing = false;
var cameraEnabled = false;
var audioEnabled = false;

function createRoom() {
    console.log("Creating Room");
    let room = document.getElementById("room-input").value;
    if (room == "" || room.trim() == "") {
      alert("Please enter a room number");
      return;
    }
    room_id = room;
    peer = new Peer(room_id, {
      host: "192.168.39.38", // Replace with your local IP address
      port: 3000,
   
      debug: 3,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
      secure: true,
    });
    peer.on("open", (id) => {
      console.log("Peer Room ID: ", id);
      notify("Waiting for peer to join.");
    });
    peer.on("call", (call) => {
      call.answer();
      call.on("stream", (stream) => {
        console.log("got call");
        console.log(stream);
        setRemoteStream(stream);
      });
      currentPeer = call;
    });
}


function setLocalStream(stream) {
    document.getElementById("local-vid-container").hidden = false;
    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}

function setScreenSharingStream(stream) {
    document.getElementById("screenshare-container").hidden = false;
    let video = document.getElementById("screenshared-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}

function setRemoteStream(stream) {
    document.getElementById("remote-vid-container").hidden = false;
    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}

function notify(msg) {
    let notification = document.getElementById("notification");
    notification.innerHTML = msg;
    notification.hidden = false;
    setTimeout(() => {
        notification.hidden = true;
    }, 3000);
}

function startScreenShare() {
    if (screenSharing) {
      stopScreenSharing();
      return;
    }
  
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((stream) => {
        setScreenSharingStream(stream);
  
        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
          stopScreenSharing();
        };
        
        if (peer) {
          // Replace the video track of the currentPeer (mobile device) with the screen stream
          let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
          });
          sender.replaceTrack(videoTrack);
          screenSharing = true;
        }
        console.log(screenStream);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  
function joinRoom() {
    console.log("Joining Room");
    let room = document.getElementById("room-input").value;
    if (room == "" || room.trim() == "") {
      alert("Please enter a room number");
      return;
    }
    room_id = room;
    peer = new Peer({
      host: "192.168.39.38", // Replace with your local IP address
      port: 9000,
      path: "/myapp",
      debug: 3,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
      secure: true,
    });
    peer.on("open", (id) => {
      console.log("Connected room with Id: " + id);
  
      navigator.mediaDevices
        .getDisplayMedia({ video: true })
        .then((stream) => {
          local_stream = stream;
          setLocalStream(local_stream);
          notify("Joining peer");
          let call = peer.call(room_id, local_stream);
          call.on("stream", (stream) => {
            setRemoteStream(stream);
          });
          currentPeer = call;
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
  


function joinRoomWithoutCamShareScreen() {
    console.log("Joining Room");
    let room = document.getElementById("room-input").value;
    if (room == "" || room.trim() == "") {
        alert("Please enter a room number");
        return;
    }
    room_id = room;
    peer = new Peer();
    peer.on("open", (id) => {
        console.log("Connected with Id: " + id);

        const createMediaStreamFake = () => {
            return new MediaStream([
                createEmptyAudioTrack(),
                createEmptyVideoTrack({ width: 640, height: 480 })
            ]);
        };

        const createEmptyAudioTrack = () => {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const dst = oscillator.connect(ctx.createMediaStreamDestination());
            oscillator.start();
            const track = dst.stream.getAudioTracks()[0];
            return Object.assign(track, { enabled: false });
        };

        const createEmptyVideoTrack = ({ width, height }) => {
            const canvas = Object.assign(document.createElement("canvas"), { width, height });
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "green";
            ctx.fillRect(0, 0, width, height);

            const stream = canvas.captureStream();
            const track = stream.getVideoTracks()[0];

            return Object.assign(track, { enabled: false });
        };

        notify("Joining peer");
        let call = peer.call(room_id, createMediaStreamFake());
        call.on("stream", (stream) => {
            setRemoteStream(stream);
        });

        currentPeer = call;
        startScreenShare();
    });
}

function joinRoomShareVideoAsStream() {
    console.log("Joining Room");
    let room = document.getElementById("room-input").value;
    if (room == "" || room.trim() == "") {
        alert("Please enter a room number");
        return;
    }

    room_id = room;
    peer = new Peer();
    peer.on("open", (id) => {
        console.log("Connected with Id: " + id);

        document.getElementById("local-media-container").hidden = false;

        const video = document.getElementById("local-media");
        video.onplay = function () {
            const stream = video.captureStream();
            notify("Joining peer");
            let call = peer.call(room_id, stream);

            call.on("stream", (stream) => {
                setRemoteStream(stream);
            });
        };
        video.play();
    });
}

function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing();
    }
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then((stream) => {
            setScreenSharingStream(stream);

            screenStream = stream;
            let videoTrack = screenStream.getVideoTracks()[0];
            videoTrack.onended = () => {
                stopScreenSharing();
            };
            if (peer) {
                let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == videoTrack.kind;
                });
                sender.replaceTrack(videoTrack);
                screenSharing = true;
            }
            console.log(screenStream);
        })
        .catch((err) => {
            console.log(err);
        });
}

function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = local_stream.getVideoTracks()[0];
    if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(videoTrack);
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
    screenSharing = false;
}

function toggleCamera() {
    if (local_stream) {
        cameraEnabled = !cameraEnabled;
        local_stream.getVideoTracks()[0].enabled = cameraEnabled;
        updateCameraButton();
    }
}

function toggleAudio() {
    if (local_stream) {
        audioEnabled = !audioEnabled;
        local_stream.getAudioTracks()[0].enabled = audioEnabled;
        updateAudioButton();
    }
}

function updateCameraButton() {
    var button = document.getElementById("camera-button");
    button.innerText = cameraEnabled ? "Camera On" : "Camera Off";
}

function updateAudioButton() {
    var button = document.getElementById("audio-button");
    button.innerText = audioEnabled ? "Audio On" : "Audio Off";
}
