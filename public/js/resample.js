// Linear-interpolation resampler from the device rate (44.1/48 kHz) to 16 kHz 16-bit PCM for
// AssemblyAI, carrying state across frames so there are no clicks at buffer boundaries.
export const TARGET_RATE = 16000;

export function makeResampler(inRate, outRate = TARGET_RATE) {
  const step = inRate / outRate;
  let carry = new Float32Array(0), pos = 0;
  return (input) => {
    const src = new Float32Array(carry.length + input.length);
    src.set(carry);
    src.set(input, carry.length);
    const out = new Int16Array(Math.max(0, Math.ceil((src.length - 1 - pos) / step)));
    let p = pos, n = 0;
    while (p + 1 < src.length && n < out.length) {
      const i = Math.floor(p), f = p - i;
      const v = src[i] * (1 - f) + src[i + 1] * f;
      out[n++] = Math.max(-1, Math.min(1, v)) * 0x7fff;
      p += step;
    }
    // p can land past the end of this frame; keep the offset so the next frame starts in the right place
    const keep = Math.min(Math.floor(p), src.length);
    carry = src.slice(keep);
    pos = p - keep;
    return out.subarray(0, n);
  };
}
