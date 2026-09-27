// Forwards raw mic frames to the main thread, where they are resampled to 16 kHz PCM.
class PcmForwarder extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor('pcm-forwarder', PcmForwarder);
