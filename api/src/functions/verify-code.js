const { app } = require("@azure/functions");
const crypto = require("crypto");
const { TableClient } = require("@azure/data-tables");

function sha256(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
function emailPk(email) {
  return sha256(normalizeEmail(email));
}
function isExpired(expiresAtIso) {
  return !expiresAtIso || Date.now() > Date.parse(expiresAtIso);
}
function addHoursIso(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

app.http("verifyCode", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "verify-code",
  handler: async (req, context) => {
    try {
      const body = await req.json().catch(() => ({}));
      const email = normalizeEmail(body.email);
      const code = String(body.code || "").trim();

      if (!email || !code) return { status: 400, body: "E-Mail oder Code fehlt" };

      const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
      const otpTable = process.env.OTP_TABLE_NAME || "otp";
      const sessionsTable = process.env.SESSIONS_TABLE_NAME || "sessions";
      const ttlHours = Number(process.env.TOKEN_TTL_HOURS || "24");

      if (!conn) return { status: 500, body: "Storage nicht konfiguriert" };

      const otpClient = TableClient.fromConnectionString(conn, otpTable);
      const sessionsClient = TableClient.fromConnectionString(conn, sessionsTable);

      const pk = emailPk(email);
      const codeHash = sha256(code);

      let match = null;
      for await (const e of otpClient.listEntities({ queryOptions: { filter: `PartitionKey eq '${pk}'` } })) {
        if (e.codeHash !== codeHash) continue;
        if (e.used === true) continue;
        if (isExpired(e.expiresAt)) continue;
        if (!match || String(e.rowKey) > String(match.rowKey)) match = e;
      }

      if (!match) return { status: 401, body: "Code ungültig oder abgelaufen" };

      await otpClient.updateEntity({ ...match, used: true }, "Replace");

      const token = randomToken();
      const expiresAt = addHoursIso(ttlHours);

      await sessionsClient.createEntity({
        partitionKey: pk,
        rowKey: token,
        email,
        createdAt: new Date().toISOString(),
        expiresAt
      });

      return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, token, expiresAt })
      };
    } catch (err) {
      context.error("verify-code error", err);
      return { status: 500, body: "Fehler beim verify-code" };
    }
  }
});
