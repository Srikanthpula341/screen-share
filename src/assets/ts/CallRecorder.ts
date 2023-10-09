export class CallRecorder {
    private localRecorder: MediaRecorder;
    private remoteRecorder: MediaRecorder;
    private localChunks: Blob[] = [];
    private remoteChunks: Blob[] = [];

    constructor(private localStream: MediaStream, private remoteStream: MediaStream) {}

    startRecording() {
        // Local Stream Recording
        this.localRecorder = new MediaRecorder(this.localStream);
        this.handleRecordingData(this.localRecorder, this.localChunks, 'local');

        // Remote Stream Recording
        this.remoteRecorder = new MediaRecorder(this.remoteStream);
        this.handleRecordingData(this.remoteRecorder, this.remoteChunks, 'remote');

        this.localRecorder.start();
        this.remoteRecorder.start();
    }

    stopRecording() {
        this.localRecorder?.stop();
        this.remoteRecorder?.stop();
    }

    private handleRecordingData(recorder: MediaRecorder, chunks: Blob[], type: 'local' | 'remote') {
        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]; 
            a.download = `call_${type}_${timestamp}.webm`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        };
    }
}
