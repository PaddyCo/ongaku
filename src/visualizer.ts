export default class Visualizer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  fftSize: number;
  analyser: any;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;    
    
    // Makse sure canvas is always the correct size
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas.bind(this));

    // The resolution of the waveform (the lower, the "blockier")
    this.fftSize = 128;

    this.context = canvasElement.getContext("2d");

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        stream.getAudioTracks();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(this.analyser);
        this.analyser.fftSize = this.fftSize;
      });

    window.requestAnimationFrame(this.draw.bind(this));
  }

  /**
   * Resizes the associated canvas to be the same size as the window
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  draw() {
    if (this.analyser) {
      const barWidth = document.body.clientWidth / (this.fftSize / 2);
      const margin = 2;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteTimeDomainData(dataArray);

      this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

      for (var i = 0; i < bufferLength; i++) {
        var height = (dataArray[i] - 128) * 20;
        this.context.fillStyle = `rgb(${dataArray[i]}, ${dataArray[i]}, ${dataArray[i]})`;
        this.context.fillRect(i * (barWidth + margin), this.context.canvas.height - (height/2), barWidth, height);
      }
    }

    window.requestAnimationFrame(this.draw.bind(this));
  }
}