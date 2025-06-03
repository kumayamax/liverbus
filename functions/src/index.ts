import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

const gmailEmail = functions.config().gmail.user;
const gmailPassword = functions.config().gmail.pass;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

export const sendShareEmail = functions.https.onCall(async (data, context) => {
  const { email, link } = data;
  if (!email || !link) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and link are required.');
  }
  const mailOptions = {
    from: gmailEmail,
    to: email,
    subject: 'Live Bus Planner 共有リンク',
    text: `共有リンク: ${link}`,
    html: `<p>共有リンク: <a href="${link}">${link}</a></p>`,
  };
  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('メール送信エラー:', error);
    throw new functions.https.HttpsError('internal', 'メール送信に失敗しました');
  }
}); 