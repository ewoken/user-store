import nodemailer from 'nodemailer';
import config from 'config';

const { options, defaults } = config.get('environment.mailer');
const transporter = nodemailer.createTransport(options, defaults);

function sendEmail(emailMessage) {
  return transporter.sendMail(emailMessage);
}

export default {
  sendEmail,
};
