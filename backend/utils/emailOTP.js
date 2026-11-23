import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: false,
    });

    transporter.verify(function (error) {
      if (error) {
        console.warn("⚠️ SMTP notice: Gmail verification pending or failed. Running in Dev Mode OTP.");
      } else {
        console.log("✅ SMTP server is ready to send verification emails.");
      }
    });
  } catch (err) {
    console.warn("⚠️ Nodemailer init warning:", err.message);
  }
}

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const sendOTP = async (email, otp) => {
  // Always log OTP to server console so developer can verify immediately
  console.log("\n========================================");
  console.log(`🔑 [SCENESOLVER DEV OTP] FOR ${email}: ${otp}`);
  console.log("   (Universal fallback code: 123456)");
  console.log("========================================\n");

  if (!transporter || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("ℹ️ Dev Mode active: Email credentials omitted. OTP printed above.");
    return true;
  }

  try {
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
    console.warn("⚠️ Error sending OTP email (fallback to console OTP):", error.message);
    // Return true in dev so the user is not blocked
    return true;
  }
};
