export class Recorder {
    private mediaRecorder: MediaRecorder;
    private chunks: Blob[] = [];
    private stream: MediaStream;
    
    constructor(stream: MediaStream) {
        console.log('Recorder constructor called');

      // setTimeout(() => {
        console.log('MediaStream :>> ', MediaStream);
        if (!stream || !stream.getAudioTracks || stream.getAudioTracks().length === 0) {
            console.error("Invalid stream passed to Recorder. Ensure it has audio tracks.");
            return;
        }
        const audioStream = new MediaStream(stream.getAudioTracks());
        console.log('Audio stream created:', audioStream);
        this.stream = audioStream;
        this.mediaRecorder = new MediaRecorder(audioStream);
       console.log('audioStream checking:>> ', audioStream);
        this.setupListeners();
      // }, 5000);
    }

    private setupListeners() {
        console.log('Setting up listeners for the media recorder');
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                console.log('Data available from media recorder:', event.data);
                this.chunks.push(event.data);
            }
        };

        this.mediaRecorder.onstart = () => {
            console.log('Media recorder started');
        };

        this.mediaRecorder.onstop = () => {
            console.log('Media recorder stopped');
        };

        this.mediaRecorder.onerror = (event) => {
            console.error('Media recorder error:', event);
        };
    }

    start() {
        console.log('Starting media recorder');
        this.mediaRecorder.start();
    }

    stop() {
        console.log('Stopping media recorder');
        return new Promise<Blob>((resolve) => {
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: 'video/webm' });
                console.log('Media recorder stopped, resolving blob:', blob);
                resolve(blob);
            };
            this.mediaRecorder.stop();
        });
    }
}
