require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

console.log("Resend API key:", process.env.RESEND_API_KEY ? "✅ Loaded" : "❌ Missing");

app.post("/api/send-emails", async (req, res) => {
  const { service, date, time, name, phone, email, address, vehicle, notes } = req.body;

  const ownerHtml = `
    <h2 style="font-family:serif;color:#0f172a">New Booking Received</h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
      <tr><td style="padding:8px;color:#64748b;width:140px">Service</td><td style="padding:8px;font-weight:600">${service}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Date &amp; Time</td><td style="padding:8px;font-weight:600">${date} at ${time}</td></tr>
      <tr><td style="padding:8px;color:#64748b">Customer</td><td style="padding:8px">${name}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Phone</td><td style="padding:8px">${phone}</td></tr>
      <tr><td style="padding:8px;color:#64748b">Email</td><td style="padding:8px">${email || "Not provided"}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Address</td><td style="padding:8px">${address}</td></tr>
      <tr><td style="padding:8px;color:#64748b">Vehicle</td><td style="padding:8px">${vehicle}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Notes</td><td style="padding:8px">${notes || "None"}</td></tr>
    </table>
  `;

  const customerHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#0f172a;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="font-family:serif;color:#86efac;margin:0;font-size:28px;">🔧 MechOnWheels</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
        <h2 style="color:#0f172a;font-family:serif;">You're Booked, ${name}!</h2>
        <p style="color:#64748b;line-height:1.6;">Your <strong>${service}</strong> appointment has been confirmed. Our mechanic will come to you.</p>
        <div style="background:#f1f5f9;border-radius:10px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;">📅 <strong style="color:#0f172a">${date} at ${time}</strong></p>
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;">📍 <strong style="color:#0f172a">${address}</strong></p>
          <p style="margin:0;font-size:13px;color:#64748b;">🚗 <strong style="color:#0f172a">${vehicle}</strong></p>
        </div>
        <p style="color:#64748b;font-size:14px;">We'll call you on <strong>${phone}</strong> to confirm.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px;">© 2026 MechOnWheels · All rights reserved</p>
      </div>
    </div>
  `;

  try {
    // Send to owner
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MechOnWheels <onboarding@resend.dev>",
        to: "mulwelim04@gmail.com",
        subject: `🔧 New Booking: ${service} – ${date} at ${time}`,
        html: ownerHtml,
      }),
    });

    // Send to customer if email provided
    if (email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MechOnWheels <onboarding@resend.dev>",
          to: email,
          subject: `✅ Your MechOnWheels Booking is Confirmed`,
          html: customerHtml,
        }),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`MechOnWheels running on port ${PORT}`));
process.on("uncaughtException", err => {
  console.error("Uncaught error:", err);
});