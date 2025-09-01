const nodemailer = require("nodemailer");
const querystring = require("querystring");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const formData = JSON.parse(event.body);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "stfxavieravcrew@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const baseUrl = process.env.URL || "https://stfxtechcrew.netlify.app";

    const qsCommon = querystring.stringify({
      email: encodeURIComponent(formData.email),
      teacherName: formData.teacherName,
      event: formData.event,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      equipmentSummary: formData.equipmentSummary || "",
      notes: formData.notes || ""
    });

    const acceptLink     = `${baseUrl}/.netlify/functions/booking-action?action=accept&${qsCommon}`;
    const denyLink       = `${baseUrl}/.netlify/functions/booking-action?action=deny&${qsCommon}`;
    const rescheduleLink = `${baseUrl}/.netlify/functions/booking-action?action=reschedule&${qsCommon}`;

    const buttonStyle = `
      display:inline-block;
      padding:10px 20px;
      margin:5px;
      font-size:16px;
      font-weight:bold;
      color:white;
      text-decoration:none;
      border-radius:6px;
    `;

    const html = `
      <h1>New Booking Request</h1>
      <p><b>Teacher:</b> ${formData.teacherName}</p>
      <p><b>Email:</b> ${formData.email}</p>
      <p><b>Event:</b> ${formData.event}</p>
      <p><b>Date:</b> ${formData.date}</p>
      <p><b>Time:</b> ${formData.startTime} – ${formData.endTime}</p>
      <p><b>Location:</b> ${formData.location}</p>
      <p><b>Equipment:</b> ${formData.equipmentSummary || "None"}</p>
      <p><b>Notes:</b> ${formData.notes || "None"}</p>
      <hr>
      <h3>Take Action:</h3>
      <p>
        <a href="${acceptLink}" style="${buttonStyle} background-color:#28a745;">✅ Accept</a>
        <a href="${denyLink}" style="${buttonStyle} background-color:#dc3545;">❌ Deny</a>
        <a href="${rescheduleLink}" style="${buttonStyle} background-color:#ffc107; color:black;">📅 Reschedule</a>
      </p>
    `;

    await transporter.sendMail({
      from: "stfxavieravcrew@gmail.com",
      to: "stfxavieravcrew@gmail.com",
      subject: "New Booking Request for STFX Tech Crew",
      html,
    });

    return { statusCode: 200, body: "Booking request submitted successfully!" };
  } catch (err) {
    console.error("Error sending booking email:", err);
    return { statusCode: 500, body: "Error submitting booking." };
  }
};
