const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set up Nodemailer transporter with your Gmail details
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'stfxavieravcrew@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD // Correct way to use the password
    }
});

// A simple in-memory store for booking requests
let bookingRequests = {};

// Handle form submission
router.post('/submit-booking', async (req, res) => {
    const formData = req.body;
    const bookingId = Date.now().toString();

    bookingRequests[bookingId] = {
        ...formData,
        status: 'pending'
    };

    const emailHtmlToCrew = `
        <h1>New Tech Crew Booking Request</h1>
        <p>A new booking has been submitted. Please review the details:</p>
        <ul>
            <li><b>Date:</b> ${formData.date}</li>
            <li><b>Start Time:</b> ${formData.startTime}</li>
            <li><b>End Time:</b> ${formData.endTime}</li>
            <li><b>Teacher:</b> ${formData.teacherName}</li>
            <li><b>Email:</b> ${formData.email}</li>
            <li><b>Event:</b> ${formData.event}</li>
            <li><b>Location:</b> ${formData.location}</li>
            <li><b>Notes:</b> ${formData.notes || 'None'}</li>
            <li><b>Equipment:</b> ${formData.equipmentSummary || 'None selected'}</li>
            ${formData.lightingOption ? `<li><b>Lighting Option:</b> ${formData.lightingOption}</li>` : ''}
            ${formData.lightingColours ? `
                <li><b>Lighting Colours:</b>
                    <ul>
                        <li>Back Left: ${formData.lightingColours.backLeft}</li>
                        <li>Back Mid Left: ${formData.lightingColours.backMidLeft}</li>
                        <li>Back Mid Right: ${formData.lightingColours.backMidRight}</li>
                        <li>Back Right: ${formData.lightingColours.backRight}</li>
                    </ul>
                </li>
            ` : ''}
        </ul>
        <hr>
        <p>Please take an action on this request:</p>
        <div style="margin-top: 20px;">
            <a href="https://stfxtechcrew.netlify.app/.netlify/functions/submit-booking/action?id=${bookingId}&action=accept" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Accept</a>
            <a href="https://stfxtechcrew.netlify.app/.netlify/functions/submit-booking/action?id=${bookingId}&action=deny" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Deny</a>
            <a href="https://stfxtechcrew.netlify.app/.netlify/functions/submit-booking/action?id=${bookingId}&action=reschedule" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reschedule</a>
        </div>
    `;

    const mailOptionsToCrew = {
        from: 'stfxavieravcrew@gmail.com',
        to: 'stfxavieravcrew@gmail.com',
        subject: 'New Booking Request for STFX Tech Crew',
        html: emailHtmlToCrew
    };

    try {
        await transporter.sendMail(mailOptionsToCrew);
        res.status(200).send('Booking request submitted successfully!');
    } catch (error) {
        console.error('Error sending email to tech crew:', error);
        res.status(500).send('Error sending email.');
    }
});

// Handle the button clicks from the email
router.get('/action', async (req, res) => {
    const { id, action } = req.query;

    if (!bookingRequests[id]) {
        return res.status(404).send('Booking request not found.');
    }

    const booking = bookingRequests[id];
    const teacherEmail = booking.email;
    let emailSubject = '';
    let emailHtmlToTeacher = '';

    booking.status = action;

    let responseMessage;
    switch (action) {
        case 'accept':
            responseMessage = `The booking for ${booking.event} has been **ACCEPTED**! A confirmation email will be sent to the teacher shortly.`;
            emailSubject = `STFX Tech Crew: Your Booking for "${booking.event}" Has Been Accepted`;
            emailHtmlToTeacher = `<p>Hello ${booking.teacherName},</p>
                <p>Your request for the event "${booking.event}" on ${booking.date} at ${booking.location} has been **ACCEPTED**.</p>
                <p>We look forward to working with you.</p>
                <p>Thank you,<br>STFX Tech Crew</p>`;
            break;
        case 'deny':
            responseMessage = `The booking for ${booking.event} has been **DENIED**. An email will be sent to the teacher.`;
            emailSubject = `STFX Tech Crew: Update on Your Booking for "${booking.event}"`;
            emailHtmlToTeacher = `<p>Hello ${booking.teacherName},</p>
                <p>We regret to inform you that we **cannot fulfill your request** for the event "${booking.event}" on ${booking.date} at ${booking.location}.</p>
                <p>This is due to our inability to perform the event as requested. We apologize for any inconvenience.</p>
                <p>Thank you,<br>STFX Tech Crew</p>`;
            break;
        case 'reschedule':
            responseMessage = `You have selected to **RESCHEDULE** the booking for ${booking.event}. An email will be sent to the teacher.`;
            emailSubject = `STFX Tech Crew: Rescheduling Your Booking for "${booking.event}"`;
            emailHtmlToTeacher = `<p>Hello ${booking.teacherName},</p>
                <p>There is a conflict with your booking for the event "${booking.event}" on ${booking.date}.</p>
                <p>We would like to **reschedule** this event. Please reply to this email to coordinate a new time.</p>
                <p>Thank you,<br>STFX Tech Crew</p>`;
            break;
        default:
            responseMessage = 'Invalid action.';
            break;
    }

    if (['accept', 'deny', 'reschedule'].includes(action)) {
        const mailOptionsToTeacher = {
            from: 'stfxavieravcrew@gmail.com',
            to: teacherEmail,
            subject: emailSubject,
            html: emailHtmlToTeacher
        };

        try {
            await transporter.sendMail(mailOptionsToTeacher);
        } catch (error) {
            console.error('Error sending confirmation email to teacher:', error);
        }
    }

    res.send(`<h1>Booking Status Updated</h1><p>${responseMessage}</p>`);
});

app.use('/.netlify/functions/submit-booking', router);

module.exports.handler = serverless(app);