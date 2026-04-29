const crypto = require("crypto");
const request = require("supertest");
const app = require("../../src/app");
const User = require("../../src/models/user");

jest.mock("../../src/services/email.service");
const emailService = require("../../src/services/email.service");

const validUser = {
  name: "Reset Tester",
  email: "reset@econagro.com",
  password: "senha123",
};

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emailService.sendPasswordResetEmail.mockResolvedValue();
  });

  it("returns 400 without email", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 200 generic response for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@econagro.com" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/se o e-mail estiver cadastrado/i);
  });

  it("does not call email service for non-existent email", async () => {
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@econagro.com" });
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("returns 200 generic response for existing email", async () => {
    await User.create(validUser);
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: validUser.email });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/se o e-mail estiver cadastrado/i);
  });

  it("saves hashed token and expiry for existing user", async () => {
    await User.create(validUser);
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: validUser.email });

    const user = await User.findOne({ email: validUser.email }).select(
      "+passwordResetToken +passwordResetExpires",
    );
    expect(user.passwordResetToken).toBeDefined();
    expect(user.passwordResetExpires).toBeDefined();
    expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
  });

  it("calls email service with correct to and resetUrl for existing user", async () => {
    await User.create(validUser);
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: validUser.email });
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: validUser.email,
        resetUrl: expect.stringMatching(
          /^http:\/\/localhost:3000\/redefinir-senha\?token=/,
        ),
      }),
    );
  });

  it("clears token and returns 503 if email send fails", async () => {
    emailService.sendPasswordResetEmail.mockRejectedValue(
      new Error("SMTP error"),
    );
    await User.create(validUser);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: validUser.email });

    expect(res.status).toBe(503);

    const user = await User.findOne({ email: validUser.email }).select(
      "+passwordResetToken +passwordResetExpires",
    );
    expect(user.passwordResetToken).toBeUndefined();
    expect(user.passwordResetExpires).toBeUndefined();
  });
});

describe("POST /api/auth/reset-password", () => {
  async function createUserWithResetToken() {
    const user = await User.create(validUser);
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    return { user, resetToken };
  }

  it("returns 400 with invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "invalid-token", password: "newpassword" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 with expired token", async () => {
    const user = await User.create(validUser);
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() - 1000;
    await user.save({ validateBeforeSave: false });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "newpassword" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 without token or password", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 if password is too short", async () => {
    const { resetToken } = await createUserWithResetToken();
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "abc" });
    expect(res.status).toBe(400);
  });

  it("updates password with valid token", async () => {
    const { resetToken } = await createUserWithResetToken();
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "novaSenha123" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/redefinida com sucesso/i);
  });

  it("clears token after successful reset", async () => {
    const { resetToken } = await createUserWithResetToken();
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "novaSenha123" });

    const user = await User.findOne({ email: validUser.email }).select(
      "+passwordResetToken +passwordResetExpires",
    );
    expect(user.passwordResetToken).toBeUndefined();
    expect(user.passwordResetExpires).toBeUndefined();
  });

  it("reusing the token returns 400", async () => {
    const { resetToken } = await createUserWithResetToken();
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "novaSenha123" });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "outraSenha456" });
    expect(res.status).toBe(400);
  });

  it("login with new password works after reset", async () => {
    const { resetToken } = await createUserWithResetToken();
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "novaSenha123" });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "novaSenha123" });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it("login with old password fails after reset", async () => {
    const { resetToken } = await createUserWithResetToken();
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "novaSenha123" });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(loginRes.status).toBe(401);
  });
});
