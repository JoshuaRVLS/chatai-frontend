
interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
    try {
        const senderName = process.env.EMAIL_FROM_NAME || "JChatAI Admin";
        const senderEmail = process.env.EMAIL_FROM || "noreply@jchatai.space";

        if (!process.env.BREVO_KEY) {
            console.error("BREVO_KEY is missing in environment variables");
            return false;
        }

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
                        email: to,
                    },
                ],
                subject: subject,
                htmlContent: html,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Brevo API Error:", errorData);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}
