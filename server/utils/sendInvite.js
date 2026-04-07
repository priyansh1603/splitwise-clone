const nodemailer = require("nodemailer");

async function sendInviteEmail(toEmail, groupName, inviterName) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  await transporter.sendMail({
    from: `"Splitwise Clone" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${inviterName} invited you to join "${groupName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2 style="color: #16a34a;">You've been invited!</h2>
        <p><strong>${inviterName}</strong> has invited you to join the group <strong>"${groupName}"</strong> on Splitwise Clone.</p>
        <p>Click the button below to create your account and join:</p>
        <a href="${process.env.CLIENT_URL || 'https://splitwise-clone-sigma.vercel.app'}/register" style="
          display: inline-block;
          background-color: #16a34a;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 10px;
        ">Create Account</a>
        <p style="margin-top: 20px; color: #888; font-size: 12px;">
          Once registered, ask ${inviterName} to add you to the group using your email.
        </p>
      </div>
    `,
  });
}

module.exports = sendInviteEmail;
