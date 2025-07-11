import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(50, '1 m'),
});

export const signin_rate_limit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '1 m'),
});