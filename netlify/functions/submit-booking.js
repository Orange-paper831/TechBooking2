const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const formData = JSON.parse(event.body);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'stfxavieravcrew@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: 'stfxavieravcrew@gmail.com',
      to: 'stfxavieravcrew@gmail.com',
      subject: 'New Booking Request for STFX Tech Crew',
      html: `
        <h1>New Booking Request</h1>
        <p><b>Teacher:</b> ${formData.teacherName}</p>
        <p><b>Email:</b> ${formData.email}</p>
        <p><b>Event:</b> ${formData.event}</p>
        <p><b>Date:</b> ${formData.date}</p>
        <p><b>Start:</b> ${formData.startTime} - <b>End:</b> ${formData.endTime}</p>
        <p><b>Location:</b> ${formData.location}</p>
        <p><b>Equipment:</b> ${formData.equipmentSummary}</p>
        <p><b>Notes:</b> ${formData.notes || "None"}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: "Booking request submitted successfully!",
    };
  } catch (err) {
    console.error("Error sending email:", err);
    return {
      statusCode: 500,
      body: "Error submitting booking.",
    };
  }
};
