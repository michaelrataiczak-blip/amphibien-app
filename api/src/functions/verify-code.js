const { TableClient } = require("@azure/data-tables");
const crypto = require("crypto");

module.exports = async function (context, req) {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      context.res = { status: 400, body: "Email oder Code fehlt" };
      return;
    }

    const tableName = "OtpCodes";
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const table = TableClient.fromConnectionString(conn, tableName);

    const rowKey = crypto.createHash("sha256").update(email).digest("hex");
    const entity = await table.getEntity("otp", rowKey);

    if (entity.code !== code) {
      context.res = { status: 401, body: "Code ungültig" };
      return;
    }

    if (Date.now() > Number(entity.expires)) {
      context.res = { status: 401, body: "Code abgelaufen" };
      return;
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        ok: true,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    };
  } catch (err) {
    context.log(err);
    context.res = { status: 500, body: "Verify failed" };
  }
};
