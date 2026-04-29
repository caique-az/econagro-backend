const express = require('express');
const request = require('supertest');
const { createAuthLimiter, createEmailLimiter } = require('../../src/middlewares/rateLimiters');

const makeApp = (limiter) => {
  const app = express();
  app.use(express.json());
  app.set('trust proxy', false);
  app.post('/test', limiter, (_req, res) => res.json({ success: true }));
  return app;
};

describe('Rate Limiters', () => {
  it('authLimiter retorna 429 após exceder o limite', async () => {
    const limiter = createAuthLimiter({ windowMs: 60 * 1000, max: 2 });
    const app = makeApp(limiter);

    await request(app).post('/test').expect(200);
    await request(app).post('/test').expect(200);
    const res = await request(app).post('/test').expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  it('emailLimiter retorna 429 após exceder o limite', async () => {
    const limiter = createEmailLimiter({ windowMs: 60 * 1000, max: 2 });
    const app = makeApp(limiter);

    await request(app).post('/test').expect(200);
    await request(app).post('/test').expect(200);
    const res = await request(app).post('/test').expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });
});
