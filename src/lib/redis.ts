import Redis from 'ioredis';
import { EventEmitter } from 'events';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Fallback in-process bus if Redis server is offline
class MemoryBus extends EventEmitter {
  async publish(channel: string, message: string): Promise<number> {
    this.emit(channel, message);
    return 1;
  }

  async subscribe(channel: string): Promise<void> {
    // handled via event listeners
  }

  async set(key: string, value: string, ...args: any[]): Promise<string> {
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    return null;
  }
}

export const memoryBus = new MemoryBus();

let redisPublisher: Redis | null = null;
let redisSubscriber: Redis | null = null;
let isRedisAvailable = false;

try {
  redisPublisher = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop spamming if local redis is not running
      }
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
  });

  redisSubscriber = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
  });

  redisPublisher.on('connect', () => {
    isRedisAvailable = true;
    console.log('[Redis] Publisher connected successfully.');
  });

  redisPublisher.on('error', (err) => {
    isRedisAvailable = false;
    // Log once quietly without crashing
  });
} catch (e) {
  isRedisAvailable = false;
}

export function getRedisStatus(): boolean {
  return isRedisAvailable;
}

export { redisPublisher, redisSubscriber };
