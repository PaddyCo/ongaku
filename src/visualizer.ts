import { TweenLite, Sine } from "gsap";

export default class Visualizer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  fftSize: number;
  framesSinceLastUpdate: number;
  analyser: any;
  updateRate: number; // How often the bars will update, in milliseconds
  audioData: Array<number>;
  barHeights: Array<number>;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;    

    this.updateRate = 100;
    
    // Makse sure canvas is always the correct size
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas.bind(this));

    // The resolution of the waveform (the lower, the "blockier")
    this.fftSize = 256;
    this.framesSinceLastUpdate = 0;

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

    // Initiliaze audio data and bar heights
    this.audioData = [];
    this.barHeights = [];
    for (var index = 0; index < this.fftSize; index++) {
      this.barHeights.push(0);
    }

    // Set intervals
    window.requestAnimationFrame(this.draw.bind(this));
    setInterval(this.update.bind(this), this.updateRate);
  }

  /**
   * Resizes the associated canvas to be the same size as the window
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Gets the latest audio data from the audio stream
   */
  update() {
    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteTimeDomainData(dataArray);

      this.audioData = [];
      
      for (var i = 0; i < bufferLength; i++) {
        this.audioData.push(dataArray[i]);

        const newHeight = Math.max(0, (dataArray[i] - 128) * 15);
        let bar = { index: i, height: this.barHeights[i] };
        
        TweenLite.to(bar, this.updateRate / 1000, {
          height: newHeight,
          onUpdate: () => {
            this.barHeights[bar.index] = bar.height;
          },
          ease: Sine.easeInOut
        });
      }
    }
  }

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const barWidth = this.canvas.width / (this.fftSize / 2);
    const margin = 2;

    if (this.barHeights) {
      for (var i = 0; i < this.barHeights.length; i++) {
        const height = this.barHeights[i];
        this.context.fillStyle = `rgb(255, 255, 255)`;
        this.context.fillRect(i * (barWidth + margin), this.context.canvas.height - (height/2), barWidth, height);
      }
    }

    window.requestAnimationFrame(this.draw.bind(this));
  }
}