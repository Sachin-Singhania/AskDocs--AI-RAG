import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`🔄 Reconnecting to Redis... Attempt #${retries}`);
      const baseDelay = 200;
      const maxDelay = 5000;
      const delay = Math.min(baseDelay * retries, maxDelay);
      const jitter = Math.random() * 100;
      return jitter + delay; 
    },
  },
});

client.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await client.connect();
})();

export default client;