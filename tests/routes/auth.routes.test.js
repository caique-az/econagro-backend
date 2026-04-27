const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user');

describe('Auth Routes', () => {
  const validUser = {
    name: 'Teste',
    email: 'teste@econagro.com',
    password: 'senha123',
  };

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: validUser.name,
          email: validUser.email,
          role: 'user',
        }),
      );
    });

    it('deve retornar erro para e-mail já cadastrado', async () => {
      await User.create(validUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/já cadastrado/i);
    });

    it('deve retornar erro sem nome', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'x@x.com', password: '123456' });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar erro sem e-mail', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Teste', password: '123456' });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar erro sem senha', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Teste', email: 'x@x.com' });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar erro com senha curta', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Teste', email: 'x@x.com', password: '123' });

      expect([400, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('não deve retornar senha no response', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.body.data.password).toBeUndefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create(validUser);
    });

    it('deve fazer login com credenciais válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: validUser.name,
          email: validUser.email,
          role: 'user',
        }),
      );
    });

    it('deve retornar 401 para senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'senha_errada' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/credenciais inválidas/i);
    });

    it('deve retornar 401 para e-mail inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'naoexiste@econagro.com', password: 'senha123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/credenciais inválidas/i);
    });

    it('deve retornar 400 sem e-mail ou senha', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 400 sem senha', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      await User.create(validUser);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const { token } = loginRes.body;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(validUser.name);
      expect(res.body.data.email).toBe(validUser.email);
      expect(res.body.data.role).toBe('user');
    });

    it('deve retornar 401 sem token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 com token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido_aqui');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('deve retornar 401 sem prefixo Bearer', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'algum_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('não deve retornar senha nos dados do usuário', async () => {
      await User.create(validUser);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.body.data.password).toBeUndefined();
    });
  });
});
