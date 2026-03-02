const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Create a transporter using your email service
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // your email address
        pass: process.env.EMAIL_PASS, // your email password or app password
      },
    });

    const mailOptions = {
      from: `"eTicketsPro" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html, // optional, if you want HTML emails
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendEmail };