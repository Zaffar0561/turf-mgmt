import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Turf Management",
    link: process.env.CLIENT_URL || "https://example.com",
  },
});

const createHtmlAndText = (mailgenContent) => {
  return {
    text: mailGenerator.generatePlaintext(mailgenContent),
    html: mailGenerator.generate(mailgenContent),
  };
};

const getTransporter = () => {
  const host =
    process.env.SMTP_HOST ||
    process.env.MAIL_HOST ||
    process.env.MAILTRAP_SMTP_HOST;
  const port = Number(
    process.env.SMTP_PORT ||
      process.env.MAIL_PORT ||
      process.env.MAILTRAP_SMTP_PORT ||
      587,
  );
  const user =
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    process.env.MAILTRAP_SMTP_USER;
  const pass =
    process.env.SMTP_PASS ||
    process.env.MAIL_PASS ||
    process.env.MAILTRAP_SMTP_PASS;

  if (!host || !user || !pass) {
    console.error(
      "SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS or MAILTRAP_SMTP_* in .env",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || false,
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async (options) => {
  const { text, html } = createHtmlAndText(options.mailgencontent);

  const transporter = getTransporter();

  // Verify transporter connection before sending to surface clear errors
  try {
    await transporter.verify();
  } catch (verifyErr) {
    console.error("SMTP verify failed. Check SMTP configuration.", verifyErr);
    throw verifyErr;
  }

  const mail = {
    from: process.env.MAIL_FROM || "zaffar@standardtouch.com",
    to: options.email,
    subject: options.subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mail);
    console.log(`Email sent to ${options.email}; messageId=${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Email service failed. Check SMTP settings.", error);
    throw error;
  }
};

const otpMailContent = (username, otp) => ({
  body: {
    name: username,
    intro: `Your verification code is ${otp}`,
    table: {
      data: [
        {
          key: "Code",
          value: otp,
        },
      ],
    },
    outro:
      "This code will expire in 10 minutes. If you did not request this, please ignore.",
  },
});

const forgotpwdmailgencontent = (username, pwdreseturl) => {
  return {
    body: {
      name: username,
      intro: "We received a request to reset your password.",
      action: {
        instructions: "Click the button below to reset your password:",
        button: {
          color: "#22bc66",
          text: "Reset Password",
          link: pwdreseturl,
        },
      },
      outro: "If you didn't request this, please ignore this email.",
    },
  };
};

export { otpMailContent, forgotpwdmailgencontent, sendEmail };
