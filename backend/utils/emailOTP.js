import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// console.log("Email Configuration:", {
//   hasUser: !!process.env.EMAIL_USER,
//   hasPassword: !!process.env.EMAIL_PASSWORD,
//   user: process.env.EMAIL_USER,
// });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true,
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP configuration error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const sendOTP = async (email, otp) => {
  try {
    console.log("Attempting to send OTP to:", email);
    console.log("Using email configuration:", {
      from: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "SceneSolver - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D83A3A; text-align: center;">SceneSolver Email Verification</h2>
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 10px;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">Your verification code for SceneSolver is:</p>
            <h1 style="text-align: center; color: #D83A3A; font-size: 36px; letter-spacing: 5px; margin: 30px 0;">${otp}</h1>
            <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
          </div>
          <p style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    console.error("Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    return false;
  }
};
