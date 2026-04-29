const nodemailer = require("nodemailer");

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const transporter = createTransport();
  const safeResetUrl = escapeHtml(resetUrl);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Recuperação de senha — EconAgro",
    html: `
      <p>Você solicitou a recuperação de senha da sua conta EconAgro.</p>
      <p>Clique no link abaixo para redefinir sua senha (válido por 30 minutos):</p>
      <p><a href="${safeResetUrl}">${safeResetUrl}</a></p>
      <p>Se você não fez essa solicitação, ignore este e-mail.</p>
    `,
  });
}

async function sendContactEmail({ name, email, message }) {
  const transporter = createTransport();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  const sentAt = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.CONTACT_TO_EMAIL,
    replyTo: email,
    subject: "Nova mensagem pelo site EconAgro",
    html: `
      <p><strong>Nome:</strong> ${safeName}</p>
      <p><strong>E-mail:</strong> ${safeEmail}</p>
      <p><strong>Mensagem:</strong></p>
      <p>${safeMessage}</p>
      <hr />
      <p><small>Enviado em: ${sentAt}</small></p>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendContactEmail };
