class AudioRecorder {
    mediaRecorder: MediaRecorder | null = null; 
    recordedChunks: Blob[] = [];
    constructor() {
      this.mediaRecorder = null;
      this.recordedChunks = [];
    }
  
    startRecording() {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          this.mediaRecorder = new MediaRecorder(stream);
  
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              this.recordedChunks.push(event.data);
            }
          };
  
          this.mediaRecorder.start();
        })
        .catch((error) => {
          console.error("Error accessing microphone:", error);
        });
    }
  
    stopRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
      }
    }
  
    saveRecording() {
      const combinedAudioBlob = new Blob(this.recordedChunks, {
        type: "audio/wav", // Adjust the MIME type as needed
      });
  
      // Create a timestamp for the file name
      const timestamp = new Date().toISOString();
  
      // Save the combined audio as a file with a timestamp
      const fileName = `recorded_audio_${timestamp}.wav`;
  
      const a = document.createElement("a");
      document.body.appendChild(a);
      //a.style = "display: none";
  
      const url = window.URL.createObjectURL(combinedAudioBlob);
      a.href = url;
      a.download = fileName;
      a.click();
  
      window.URL.revokeObjectURL(url);
    }
  }
  