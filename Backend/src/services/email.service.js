import nodemailer from "nodemailer"
import config from "../config/config.js"

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//     type: 'OAuth2',
//     user: config.GOOGLE_USER,
//     clientId: config.GOOGLE_CLIENT_ID,
//     clientSecret: config.GOOGLE_CLIENT_SECRET,
//     refreshToken: config.GOOGLE_REFRESH_TOKEN,
//   }
// })

const transporter = nodemailer.createTransport({
   service:"gmail",
   auth:{
    user: config.GOOGLE_USER, //Gmail address
    pass: config.GOOGLE_APP_PASSWORD
   }
})

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
export const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Auto Hub" <${config.GOOGLE_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};