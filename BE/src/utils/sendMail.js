import nodemailer from 'nodemailer';

const sendMail = async ({ email, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Tổng Đài Đặt Vé NetBus 🚌" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: html,
  };

  return await transporter.sendMail(mailOptions);
};

export default sendMail;