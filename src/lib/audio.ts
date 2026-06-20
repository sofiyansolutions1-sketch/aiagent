export function pcmToBase64(pcmData: Float32Array): string {
  // Live API expects 16-bit PCM little-endian
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  
  for (let i = 0; i < pcmData.length; i++) {
    // scale to 16-bit integer
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(i * 2, int16, true); // true for little-endian
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  // process in chunks to prevent Maximum call stack size exceeded
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const audioQueue: AudioBuffer[] = [];
let nextStartTime = 0;

export async function playAudioChunk(context: AudioContext, base64Audio: string) {
  const binary = atob(base64Audio);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }

  const pcm16 = new Int16Array(buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768.0;
  }

  const audioBuffer = context.createBuffer(1, float32.length, 24000); // output from live api is 24kHz
  audioBuffer.getChannelData(0).set(float32);
  
  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(context.destination);
  
  const currentTime = context.currentTime;
  if (nextStartTime < currentTime) {
    nextStartTime = currentTime + 0.05; // tiny buffer
  }
  
  source.start(nextStartTime);
  nextStartTime += audioBuffer.duration;
}

export function resetAudioPlayback() {
   nextStartTime = 0;
}
