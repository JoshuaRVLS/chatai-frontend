import { NextResponse } from "next/server";
import { rateLimit } from "@/app/utils/rateLimit";
import { headers } from "next/headers";

export const POST = async (req: Request) => {
  const headerPayload = await headers();
  const ip = headerPayload.get("x-forwarded-for") || "unknown";

  const limitResult = await rateLimit(ip, { limit: 10, windowMs: 300000 }); // 10 emails per 5 mins
  if (!limitResult.success) {
    return NextResponse.json(
      { success: false, message: "Terlalu banyak permintaan verifikasi. Silakan coba lagi nanti." },
      { status: 429 }
    );
  }

  const { email, verificationToken } = await req.json();

  console.log(`📧 Attempting to send verification code to: ${email}`);

  try {
    const senderName = process.env.EMAIL_FROM_NAME || "JChatAI";
    const senderEmail = process.env.EMAIL_FROM || "noreply@jchatai.space";

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_KEY as string,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: "Verify Your Email Address",
        htmlContent: `
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
        .code-container {
            text-align: center;
            margin: 30px 0;
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #4299e1;
            background-color: #ebf8ff;
            padding: 15px 30px;
            border-radius: 8px;
            border: 1px dashed #4299e1;
            display: inline-block;
        }
        .divider {
            border-top: 1px solid #e2e8f0;
            margin: 25px 0;
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
            <img src="https://via.placeholder.com/150x50?text=JChatAI" alt="JChatAI Logo" class="logo">
            <h1>Verify Your Email Address</h1>
        </div>
        
        <p>Thanks for signing up! To complete your registration, please use the verification code below:</p>
        
        <div class="code-container">
            <div class="verification-code">${verificationToken}</div>
        </div>
        
        <p>This code will expire in 24 hours. If you didn't request this email, you can safely ignore it.</p>
        
        <div class="divider"></div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} JChatAI. All rights reserved.</p>
        </div>
      </div>
</body>
</html>
      `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error:", errorData);
      throw new Error(`Brevo API responded with status ${response.status}`);
    }

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
