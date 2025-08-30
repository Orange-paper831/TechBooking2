const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  const { action, email, event: eventName, date } = event.queryStringParameters;

  if (!action || !email) {
    return { statusCode: 400, body: "Missing required parameters" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "stfxavieravcrew@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    let subject, message;

    switch (action) {
      case "accept":
        subject = "Booking Accepted";
        message = `✅ Your booking request for "${eventName}" on ${date} has been accepted by the STFX Tech Crew.`;
        break;

      case "deny":
        subject = "Booking Denied";
        message = `❌ Sorry, your booking request for "${eventName}" on ${date} has been denied.`;
        break;

      case "reschedule":
        subject = "Booking Needs Rescheduling";
        message = `📅 Your booking request for "${eventName}" on ${date} needs to be rescheduled. Please contact us.`;
        break;

      default:
        return { statusCode: 400, body: "Invalid action" };
    }

    await transporter.sendMail({
      from: "stfxavieravcrew@gmail.com",
      to: decodeURIComponent(email),
      subject,
      text: message,
    });

    return {
      statusCode: 200,
      body: `Action "${action}" processed successfully and email sent to ${email}.`,
    };
  } catch (err) {
    console.error("Error processing booking action:", err);
    return { statusCode: 500, body: "Error processing booking action." };
  }
};
