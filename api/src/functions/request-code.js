const { app } = require("@azure/functions");
const nodemailer = require("nodemailer");

app.http("requestCode", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "request-code",
  handler: async (req, context) => {
    try {
      const body = await req.json().catch(() => ({}));
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) return { status: 400, body: "E-Mail fehlt" };

      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT || "587");
      const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const from = process.env.MAIL_FROM || user;
      const fromName = process.env.MAIL_FROM_NAME || "Amphibien-App";

      if (!host || !user || !pass) {
        return { status: 500, body: "SMTP nicht konfiguriert (HOST/USER/PASS fehlt)" };
      }

      const transporter = nodemailer.createTransport({
        host, port, secure,
        auth: { user, pass }
      });

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to: email,
        subject: "Dein Einmalcode für die Amphibien-App",
        text: `Hallo!\n\nDein Einmalcode lautet: ${code}\n\nDer Code ist ca. 10 Minuten gültig.`
      });

      return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true })
      };
    } catch (err) {
      context.error("requestCode error", err);
      return { status: 500, body: "Fehler beim Mailversand" };
    }
  }
});

