import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { rateLimit } from "@/app/utils/rateLimit";
import { headers } from "next/headers";

export const POST = async (req: Request) => {
  const headerPayload = await headers();
  const ip = headerPayload.get("x-forwarded-for") || "unknown";

  const limitResult = await rateLimit(ip, { limit: 2, windowMs: 300000 }); // 2 emails per 5 mins
  if (!limitResult.success) {
    return NextResponse.json(
      { success: false, message: "Terlalu banyak permintaan verifikasi. Silakan coba lagi nanti." },
      { status: 429 }
    );
  }

  const { email, verificationToken } = await req.json();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST as string,
    secure: false,
    port: process.env.EMAIL_SERVER_PORT,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  } as SMTPTransport.Options);

  const baseUrl = new URL(req.url).origin;
  const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

  console.log(`📧 Attempting to send verification email to: ${email}`);
  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log("✅ SMTP connection verified");

    await transporter.sendMail({
      from: `"JCorp" <${process.env.BREVO_EMAIL}>`,
      to: email,
      subject: "Verify Your Email Address",
      html: `
       <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7f9fc;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 15px;
        }
        h1 {
            color: #2d3748;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4299e1;
            color: white !important;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #3182ce;
        }
        .divider {
            border-top: 1px solid #e2e8f0;
            margin: 25px 0;
        }
        .link-text {
            word-break: break-all;
            background-color: #f0f4f8;
            padding: 12px;
            border-radius: 4px;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #718096;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Replace with your logo -->
            <img src="https://via.placeholder.com/150x50?text=Your+Logo" alt="Company Logo" class="logo">
            <h1>Verify Your Email Address</h1>
        </div>
        
        <p>Thanks for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
        </div>
        
        <div class="divider"></div>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p class="link-text">${verificationLink}</p>
        
        <p>This link will expire in 24 hours. If you didn't request this email, you can safely ignore it.</p>
      </div>
</body>
</html>
      `,
    });

    console.log(`✅ Verification email sent successfully to: ${email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send verification email" },
      { status: 500 }
    );
  }
};
