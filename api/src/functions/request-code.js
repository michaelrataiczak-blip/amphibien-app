const nodemailer = require("nodemailer");

module.exports = async function (context, req) {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    if (!email) {
      context.res = { status: 400, body: "E-Mail fehlt" };
      return;
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || "587");
    const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      context.res = { status: 500, body: "SMTP nicht konfiguriert" };
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await transporter.sendMail({
      from: `"Amphibien-App" <${user}>`,
      to: email,
      subject: "Dein Einmalcode für die Amphibien-App",
      text: `Hallo!\n\nDein Einmalcode lautet: ${code}\n\nDer Code ist ca. 10 Minuten gültig.`
    });

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { ok: true }
    };
  } catch (err) {
    context.log("request-code error", err);
    context.res = { status: 500, body: "Fehler beim Mailversand" };
  }
};
