import { Device } from "mediasoup-client";

// Client side of the backend's live-stream SFU (Connect-backend/src/socket/sfu.js).
// No TURN here: the server is reachable directly on UDP, or TCP as a fallback.

const request = (socket, event, data = {}) =>
  new Promise((resolve, reject) => {
    socket.timeout(10_000).emit(event, data, (err, res) => {
      if (err) reject(new Error(`${event}: no answer from the server`));
      else if (res?.error) reject(new Error(`${event}: ${res.error}`));
      else resolve(res);
    });
  });

async function createTransport(socket, device, direction) {
  const params = await request(socket, "sfu:create-transport", { direction });
  const transport =
    direction === "send" ? device.createSendTransport(params) : device.createRecvTransport(params);
  transport.on("connect", ({ dtlsParameters }, done, fail) =>
    request(socket, "sfu:connect-transport", { direction, dtlsParameters }).then(() => done(), fail)
  );
  return transport;
}

// Host: returns the send transport; produce tracks on it with transport.produce().
export async function connectSfuSender(socket) {
  const { rtpCapabilities } = await request(socket, "sfu:join");
  const device = new Device();
  await device.load({ routerRtpCapabilities: rtpCapabilities });
  const transport = await createTransport(socket, device, "send");
  transport.on("produce", ({ kind, rtpParameters }, done, fail) =>
    request(socket, "sfu:produce", { kind, rtpParameters }).then(({ id }) => done({ id }), fail)
  );
  return { transport, close: () => transport.close() };
}

// Viewer: receives the host's tracks. onTrack({ track, socketId, user }) for
// each one, onTrackEnded({ track, socketId }) when the host stops sending it.
export async function connectSfuReceiver(socket, { onTrack, onTrackEnded }) {
  const consumers = new Map(); // consumerId -> { consumer, socketId }
  const seen = new Set(); // producer ids, so a producer is never consumed twice
  let ready;

  const consume = async ({ id: producerId, socketId, user }) => {
    if (seen.has(producerId)) return;
    seen.add(producerId);
    const { device, transport } = await ready;
    const params = await request(socket, "sfu:consume", {
      producerId,
      rtpCapabilities: device.rtpCapabilities,
    });
    const consumer = await transport.consume(params);
    consumers.set(consumer.id, { consumer, socketId });
    await request(socket, "sfu:resume", { consumerId: consumer.id });
    onTrack({ track: consumer.track, socketId, user });
  };
  const warn = (e) => console.warn("[sfu]", e.message);

  // Listen before joining so a producer created in between isn't missed.
  const onNewProducer = (p) => consume(p).catch(warn);
  const onConsumerClosed = ({ consumerId }) => {
    const entry = consumers.get(consumerId);
    if (!entry) return;
    consumers.delete(consumerId);
    entry.consumer.close();
    onTrackEnded({ track: entry.consumer.track, socketId: entry.socketId });
  };
  socket.on("sfu:new-producer", onNewProducer);
  socket.on("sfu:consumer-closed", onConsumerClosed);
  const stopListening = () => {
    socket.off("sfu:new-producer", onNewProducer);
    socket.off("sfu:consumer-closed", onConsumerClosed);
  };

  ready = (async () => {
    const { rtpCapabilities, producers } = await request(socket, "sfu:join");
    const device = new Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    const transport = await createTransport(socket, device, "recv");
    return { device, transport, producers };
  })();

  let transport;
  let producers;
  try {
    ({ transport, producers } = await ready);
  } catch (err) {
    stopListening();
    throw err;
  }
  await Promise.all(producers.map((p) => consume(p).catch(warn)));

  return {
    close: () => {
      stopListening();
      transport.close();
    },
  };
}
