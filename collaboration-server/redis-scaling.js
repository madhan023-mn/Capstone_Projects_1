const Redis = require('ioredis');
const crypto = require('crypto');

const INSTANCE_ID = `collab-node-${crypto.randomBytes(4).toString('hex')}`;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisScalingManager {
  constructor() {
    this.instanceId = INSTANCE_ID;
    this.publisher = null;
    this.subscriber = null;
    this.isRedisActive = false;
    this.handlers = new Map(); // docId -> { onRemoteUpdate, onRemoteAwareness }

    this.init();
  }

  init() {
    try {
      this.publisher = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
        lazyConnect: true,
      });

      this.subscriber = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
        lazyConnect: true,
      });

      this.publisher.on('connect', () => {
        this.isRedisActive = true;
        console.log(`[Redis Scaling] (${this.instanceId}) Publisher connected to ${REDIS_URL}`);
      });

      this.subscriber.on('connect', () => {
        console.log(`[Redis Scaling] (${this.instanceId}) Subscriber connected.`);
        // Re-subscribe to any active rooms
        for (const docId of this.handlers.keys()) {
          this.subscriber.subscribe(`collab:updates:${docId}`);
        }
      });

      this.publisher.on('error', () => {
        this.isRedisActive = false;
      });

      this.subscriber.on('error', () => {
        this.isRedisActive = false;
      });

      this.subscriber.on('message', (channel, message) => {
        try {
          const payload = JSON.parse(message);
          // Ignore messages originated from this exact server instance
          if (payload.originInstanceId === this.instanceId) return;

          const docId = payload.docId;
          const handler = this.handlers.get(docId);
          if (!handler) return;

          if (channel.startsWith('collab:updates:') && payload.updateBase64) {
            const update = Buffer.from(payload.updateBase64, 'base64');
            handler.onRemoteUpdate(new Uint8Array(update));
          }
        } catch (err) {
          console.error('[Redis Scaling] Error processing message:', err.message);
        }
      });

      // Try connecting
      this.publisher.connect().catch(() => {
        console.log(`[Redis Scaling] Running in standalone single-instance mode (Redis offline at ${REDIS_URL}).`);
      });
      this.subscriber.connect().catch(() => {});
    } catch (e) {
      console.log(`[Redis Scaling] Running in standalone mode.`);
    }
  }

  registerRoom(docId, onRemoteUpdate) {
    this.handlers.set(docId, { onRemoteUpdate });
    if (this.isRedisActive && this.subscriber) {
      this.subscriber.subscribe(`collab:updates:${docId}`).catch(() => {});
    }
  }

  unregisterRoom(docId) {
    this.handlers.delete(docId);
    if (this.isRedisActive && this.subscriber) {
      this.subscriber.unsubscribe(`collab:updates:${docId}`).catch(() => {});
    }
  }

  publishUpdate(docId, updateUint8Array) {
    if (!this.isRedisActive || !this.publisher) return;
    try {
      const updateBase64 = Buffer.from(updateUint8Array).toString('base64');
      const payload = JSON.stringify({
        originInstanceId: this.instanceId,
        docId,
        updateBase64,
        timestamp: Date.now(),
      });
      this.publisher.publish(`collab:updates:${docId}`, payload).catch(() => {});
    } catch (err) {
      console.error('[Redis Scaling] Error publishing update:', err.message);
    }
  }

  getStatus() {
    return {
      instanceId: this.instanceId,
      isRedisActive: this.isRedisActive,
      activeRooms: Array.from(this.handlers.keys()),
    };
  }
}

module.exports = new RedisScalingManager();
