const request = require("supertest");
const app = require("../../src/app");

jest.mock("../../src/services/email.service");
const emailService = require("../../src/services/email.service");

const validPayload = {
  name: "João Silva",
  email: "joao@exemplo.com",
  message: "Olá, gostaria de mais informações sobre os produtos.",
};

describe("POST /api/contact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emailService.sendContactEmail.mockResolvedValue();
  });

  it("returns 200 with valid payload", async () => {
    const res = await request(app).post("/api/contact").send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/enviada com sucesso/i);
  });

  it("calls email service with normalized fields", async () => {
    await request(app).post("/api/contact").send(validPayload);
    expect(emailService.sendContactEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendContactEmail).toHaveBeenCalledWith({
      name: "João Silva",
      email: "joao@exemplo.com",
      message: "Olá, gostaria de mais informações sobre os produtos.",
    });
  });

  it("normalizes whitespace and uppercased email before sending", async () => {
    await request(app)
      .post("/api/contact")
      .send({
        name: "  João Silva  ",
        email: "  JOAO@EXEMPLO.COM  ",
        message: "  Olá, gostaria de mais informações sobre os produtos.  ",
      });
    expect(emailService.sendContactEmail).toHaveBeenCalledWith({
      name: "João Silva",
      email: "joao@exemplo.com",
      message: "Olá, gostaria de mais informações sobre os produtos.",
    });
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validPayload, name: undefined });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when name is too short", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validPayload, name: "Jo" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validPayload, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when message is too short", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validPayload, message: "curta" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when message is missing", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validPayload, message: undefined });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 503 when email service fails", async () => {
    emailService.sendContactEmail.mockRejectedValue(new Error("SMTP error"));
    const res = await request(app).post("/api/contact").send(validPayload);
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });
});
