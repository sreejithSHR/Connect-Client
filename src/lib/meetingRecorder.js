/**
 * Records the WHOLE meeting client-side without a screen-share prompt.
 *
 * It composites every participant's video into a grid on a <canvas> and mixes
 * all audio tracks via the Web Audio API, then records canvas.captureStream() +
 * the mixed audio with MediaRecorder. `getStreams()` is read every frame so
 * participants joining/leaving (and the presenter's screen) update live.
 */

const pickMime = () => {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";
};

const drawCover = (ctx, video, x, y, w, h) => {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    ctx.fillStyle = "#1f1f23";
    ctx.fillRect(x, y, w, h);
    return;
  }
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(video, dx, dy, dw, dh);
  ctx.restore();
};

const downloadBlob = (blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `connect-recording-${Date.now()}.webm`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function startMeetingRecording(getStreams, onStop) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  const videos = new Map(); // id -> hidden <video>
  const audioConnected = new Set();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  const dest = audioCtx.createMediaStreamDestination();
  let raf = null;

  const ensure = (item) => {
    if (!videos.has(item.id)) {
      const v = document.createElement("video");
      v.srcObject = item.stream;
      v.muted = true;
      v.autoplay = true;
      v.playsInline = true;
      v.play().catch(() => {});
      videos.set(item.id, v);
    }
    if (!audioConnected.has(item.id) && item.stream.getAudioTracks().length) {
      try {
        audioCtx.createMediaStreamSource(item.stream).connect(dest);
        audioConnected.add(item.id);
      } catch (e) {
        /* already connected */
      }
    }
    return videos.get(item.id);
  };

  const draw = () => {
    const items = (getStreams() || []).filter((s) => s && s.stream);
    ctx.fillStyle = "#0e0e10";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const n = Math.max(items.length, 1);
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cw = canvas.width / cols;
    const ch = canvas.height / rows;

    items.forEach((item, i) => {
      const v = ensure(item);
      const cx = (i % cols) * cw;
      const cy = Math.floor(i / cols) * ch;
      drawCover(ctx, v, cx + 6, cy + 6, cw - 12, ch - 12);
    });

    raf = requestAnimationFrame(draw);
  };
  draw();

  const canvasStream = canvas.captureStream(30);
  const mixed = new MediaStream([
    canvasStream.getVideoTracks()[0],
    ...dest.stream.getAudioTracks(),
  ]);

  const chunks = [];
  const mime = pickMime();
  const recorder = new MediaRecorder(mixed, mime ? { mimeType: mime } : undefined);
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    if (raf) cancelAnimationFrame(raf);
    videos.forEach((v) => {
      v.srcObject = null;
    });
    videos.clear();
    try { audioCtx.close(); } catch (e) { /* ignore */ }
    canvasStream.getTracks().forEach((t) => t.stop());
    downloadBlob(new Blob(chunks, { type: "video/webm" }));
    onStop && onStop();
  };
  recorder.start(1000);

  return {
    stop() {
      try { recorder.stop(); } catch (e) { /* ignore */ }
    },
  };
}
