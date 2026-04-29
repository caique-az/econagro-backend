const nodemailer = require("nodemailer");

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

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Recuperação de senha — EconAgro",
    html: `
      <p>Você solicitou a recuperação de senha da sua conta EconAgro.</p>
      <p>Clique no link abaixo para redefinir sua senha (válido por 30 minutos):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Se você não fez essa solicitação, ignore este e-mail.</p>
    `,
  });
}

async function sendContactEmail({ name, email, message }) {
  const transporter = createTransport();

  const sentAt = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.CONTACT_TO_EMAIL,
    replyTo: email,
    subject: "Nova mensagem pelo site EconAgro",
    html: `
      <p><strong>Nome:</strong> ${name}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Mensagem:</strong></p>
      <p>${message}</p>
      <hr />
      <p><small>Enviado em: ${sentAt}</small></p>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendContactEmail };
