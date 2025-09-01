const nodemailer = require("nodemailer");
const fetch = require("node-fetch"); // Netlify has node-fetch v2

exports.handler = async (event) => {
  const p = event.queryStringParameters || {};
  const action = p.action;

  if (!action || !p.email) {
    return { statusCode: 400, body: "Missing required parameters" };
  }

  const teacherEmail     = decodeURIComponent(p.email);
  const teacherName      = p.teacherName || "";
  const eventName        = p.event || "";
  const date             = p.date || "";
  const startTime        = p.startTime || "";
  const endTime          = p.endTime || "";
  const location         = p.location || "";
  const equipmentSummary = p.equipmentSummary || "";
  const notes            = p.notes || "";

  try {
    let extraMessage = "";

    if (action === "accept") {
      // Call your Google Apps Script to post to Classroom
      const scriptUrl = process.env.APPS_SCRIPT_WEBAPP_URL;

      const resp = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventName,
          date,
          startTime,
          endTime,
          location,
          teacherName,
          equipmentSummary,
          notes
        }),
      });

      const json = await resp.json();
      if (!json.ok) {
        throw new Error("Apps Script error: " + (json.error || "unknown"));
      }

      extraMessage = `\n\nWe’ve posted this event to our Classroom with a signup form: ${json.formUrl}`;
    }

    // Email teacher
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "stfxavieravcrew@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    let subject, text;
    switch (action) {
      case "accept":
        subject = "Booking Accepted";
        text = `Hello ${teacherName},

Your booking request for "${eventName}" on ${date} at ${location} has been accepted.${extraMessage}

Thank you,
STFX Tech Crew`;
        break;
      case "deny":
        subject = "Booking Denied";
        text = `Hello ${teacherName},

Sorry, we cannot fulfill your booking request for "${eventName}" on ${date} at ${location}.

Thank you,
STFX Tech Crew`;
        break;
      case "reschedule":
        subject = "Booking Needs Rescheduling";
        text = `Hello ${teacherName},

We need to reschedule your booking request for "${eventName}" on ${date}. Please reply to coordinate a new time.

Thank you,
STFX Tech Crew`;
        break;
      default:
        return { statusCode: 400, body: "Invalid action" };
    }

    await transporter.sendMail({
      from: "stfxavieravcrew@gmail.com",
      to: teacherEmail,
      subject,
      text,
    });

    // Confirmation page
    const message =
      action === "accept"
        ? "✅ You accepted this booking. Announcement posted to Classroom."
        : action === "deny"
        ? "❌ You denied this booking."
        : "📅 You requested to reschedule.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `<h1>Booking Status Updated</h1><p>${message}</p>`,
    };

  } catch (err) {
    console.error("Error processing booking action:", err);
    return { statusCode: 500, body: "Error processing booking action." };
  }
};
