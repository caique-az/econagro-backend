const request = require('supertest');
const app = require('../../src/app');

describe('Health Routes', () => {
  describe('GET /', () => {
    it('deve retornar informações da API', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('EconAgro API');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.status).toBe('online');
    });
  });

  describe('GET /api/health', () => {
    it('deve retornar status de saúde', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('API está funcionando');
    });
  });

  describe('Rota 404', () => {
    it('deve retornar 404 para rota inexistente', async () => {
      const res = await request(app).get('/rota/inexistente');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Rota não encontrada');
    });
  });
});
